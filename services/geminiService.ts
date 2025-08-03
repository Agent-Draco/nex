import { GoogleGenAI, Type } from "@google/genai";
import { OSConcept } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder for environments where the key is not set.
  // The web app environment is expected to have this variable.
  console.warn("API_KEY environment variable not set. Using a placeholder.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

const readFileAsText = (file: File): Promise<{ name: string, content: string }> => {
  return new Promise((resolve, reject) => {
    // Limit file size to prevent sending huge amounts of data
    if (file.size > 1024 * 1024) { // 1MB limit
        resolve({ name: file.name, content: `[File is too large to read content (${(file.size / (1024*1024)).toFixed(2)} MB)]` });
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      // We only care about text-based content. Heuristic check.
      const content = reader.result as string;
      // Simple check for binary content
      if (content.includes('\uFFFD')) {
          resolve({ name: file.name, content: '[Binary file content not readable]' });
      } else {
          resolve({ name: file.name, content: content.substring(0, 5000) }); // Truncate content
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const generateOsConcept = async (prompt: string, files: File[]): Promise<OSConcept> => {
  const fileContents = await Promise.all(files.map(readFileAsText));
  
  const fileDetails = fileContents.length > 0
    ? `The user has provided the following files for inspiration. Interpret their purpose from their names and content snippets:\n\n${fileContents.map(f => `File: ${f.name}\nSnippet:\n---\n${f.content}\n---\n`).join('\n')}`
    : 'The user has not provided any files. Rely solely on their prompt.';

  const systemInstruction = `You are an expert systems architect and creative OS designer. Your task is to conceptualize a new Linux-based operating system based on a user's prompt and a list of provided filenames/content. You must generate a detailed, structured concept in JSON format. Your response MUST strictly adhere to the provided JSON schema. Be creative, thematic, and plausible.`;
  
  const fullPrompt = `
    User's core idea: "${prompt}"

    ${fileDetails}

    Based on all this information, generate a complete OS concept. The OS must be based on the Linux kernel. Create a cool, thematic name and a unique codename. The boot screen ASCII art should be creative and relevant to the OS theme.
  `;
  
  const osSchema = {
    type: Type.OBJECT,
    properties: {
      osName: { type: Type.STRING, description: "A creative, unique name for the OS." },
      codename: { type: Type.STRING, description: "A cool, internal codename for the OS version." },
      philosophy: { type: Type.STRING, description: "A short paragraph explaining the OS's core purpose and design principles." },
      kernelVersion: { type: Type.STRING, description: "A plausible Linux kernel version, e.g., 'Linux Kernel 6.9'." },
      desktopEnvironment: { type: Type.STRING, description: "The default desktop environment or window manager, e.g., 'Custom Tiling Window Manager based on Hyprland'." },
      defaultShell: { type: Type.STRING, description: "The default command-line shell, e.g., 'Zsh with Powerlevel10k'." },
      keyFeatures: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of 3-5 key, standout features of the OS."
      },
      defaultPackages: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A list of essential pre-installed packages/tools based on the OS philosophy and input files."
      },
      bootScreenAscii: { type: Type.STRING, description: "Creative ASCII art for the boot screen, using backslashes for escaping where needed. It must be multiline." }
    },
    required: ["osName", "codename", "philosophy", "kernelVersion", "desktopEnvironment", "defaultShell", "keyFeatures", "defaultPackages", "bootScreenAscii"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: osSchema,
        temperature: 0.8,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as OSConcept;
  } catch (error) {
    console.error("Error generating OS concept:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate OS concept from API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the OS concept.");
  }
};

export const generateBuildScript = async (concept: OSConcept): Promise<string> => {
  const systemInstruction = `You are a senior Linux systems engineer. Your task is to generate a real, high-level shell script to set up a custom Linux environment based on a provided JSON specification. The script should be based on a common base distribution (like Debian/Ubuntu, using apt). It is for educational purposes and for advanced users who understand the risks. It is intended to be run in a safe, isolated environment like a VM or container.`;

  const fullPrompt = `
    Based on the following OS concept, generate a bash script that automates the setup.

    OS Concept:
    ${JSON.stringify(concept, null, 2)}

    The script MUST:
    1. Start with \`#!/bin/bash\` and \`set -e\` to exit on error.
    2. Include a prominent comment block at the top, warning the user that this is an automated script that will install software and modify system configuration, and should ONLY be run in a dedicated VM or container by an advanced user who understands the commands.
    3. Use \`apt-get\` for package management, assuming a Debian/Ubuntu base.
    4. Start by running \`apt-get update\`.
    5. Install necessary dependencies like \`build-essential\`, \`git\`, etc.
    6. Install the specified desktop environment (${concept.desktopEnvironment}) and default packages (${concept.defaultPackages.join(', ')}) using \`apt-get install -y\`. Handle cases where the desktop environment might be a specific name not in the default repos by searching for a close equivalent (e.g., if "Hyprland" is specified, install hyprland).
    7. Use \`echo\` to print progress messages for each major step.
    8. Reference details from the OS concept where appropriate.
    9. NOT perform any destructive actions like partitioning disks (\`fdisk\`, \`mkfs\`), or rebooting the system. It should assume it's running on an existing base installation.
    10. Conclude with an echo message telling the user that the script has finished and what they might want to do next (e.g., "Setup complete. Please reboot or configure your dotfiles.").
    11. The entire output must be a single block of shell script code.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Lower temperature for more deterministic script generation
      },
    });
    
    // The model might wrap the script in markdown, so let's clean it up.
    let script = response.text;
    script = script.replace(/^```bash\n/, '');
    script = script.replace(/\n```$/, '');
    
    return script.trim();
  } catch (error) {
    console.error("Error generating build script:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate build script from API: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the build script.");
  }
};
