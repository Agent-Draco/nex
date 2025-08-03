import React, { useState, useEffect, useRef } from 'react';
import DownloadIcon from './icons/DownloadIcon';

interface TerminalProps {
  script: string;
  codename: string;
}

const Terminal: React.FC<TerminalProps> = ({ script, codename }) => {
  const [output, setOutput] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOutput([]);
    const lines = script.split('\n');
    let currentLine = 0;

    const processLine = () => {
      if (currentLine < lines.length) {
        const line = lines[currentLine];
        const sleepMatch = line.match(/sleep (\d+(\.\d+)?)/);
        const delay = sleepMatch ? parseFloat(sleepMatch[1]) * 1000 : Math.random() * 50 + 20;

        setOutput(prev => [...prev, line]);
        currentLine++;
        
        setTimeout(processLine, delay);
      }
    };

    const startTimeout = setTimeout(processLine, 500);

    return () => clearTimeout(startTimeout);
  }, [script]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  const handleDownload = () => {
    const blob = new Blob([script], { type: 'text/x-shellscript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-${codename.toLowerCase().replace(/[\s_]+/g, '-')}.sh`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderLine = (line: string) => {
    // Colorize based on content, but only if it's not a sleep command
    if (line.trim().startsWith('sleep')) {
        return null; // Don't render sleep commands
    }
      
    let coloredLine = line
      .replace(/\\e\[32m/g, '<span class="text-green-400">')
      .replace(/\\e\[33m/g, '<span class="text-yellow-400">')
      .replace(/\\e\[36m/g, '<span class="text-cyan-400">')
      .replace(/\\e\[0m/g, '</span>');

    if (line.trim().startsWith('#')) {
      return <span className="text-gray-400 italic" dangerouslySetInnerHTML={{ __html: coloredLine }} />;
    }
    if (line.includes('ERROR')) {
       return <span className="text-red-500" dangerouslySetInnerHTML={{ __html: coloredLine }} />;
    }

    return <span dangerouslySetInnerHTML={{ __html: coloredLine }} />;
  };

  return (
    <div className="w-full bg-[#0D1117] border border-gray-700 rounded-lg shadow-2xl shadow-cyan-500/10 overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <p className="text-sm text-gray-400">bash -- Building OS...</p>
        <button 
          onClick={handleDownload}
          title="Download build script"
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-gray-700"
        >
          <DownloadIcon className="w-4 h-4" />
          <span className="text-xs hidden sm:inline">Download Script</span>
        </button>
      </div>
      <div className="p-4 font-mono text-sm text-gray-200 h-96 overflow-y-auto terminal-output">
        <pre className="whitespace-pre-wrap break-words">
          {output.map((line, index) => {
            const rendered = renderLine(line);
            if (!rendered) return null;
            return (
              <div key={index} className="flex">
                <span className="text-green-400 mr-2 shrink-0">$</span>
                <div className="flex-grow">{rendered}</div>
              </div>
            )
          })}
        </pre>
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Terminal;
