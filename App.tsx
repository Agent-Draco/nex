import React, { useState, useCallback } from 'react';
import { OSConcept } from './types';
import { generateOsConcept, generateBuildScript } from './services/geminiService';
import FileUpload from './components/FileUpload';
import OsDisplay from './components/OsDisplay';
import AIIcon from './components/icons/AIIcon';
import Spinner from './components/ui/Spinner';
import NexusLogo from './components/icons/NexusLogo';
import Terminal from './components/Terminal';

const App: React.FC = () => {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [osConcept, setOsConcept] = useState<OSConcept | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [buildScript, setBuildScript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = useCallback((newFiles: File[]) => {
    setFiles(newFiles);
  }, []);

  const handleGenerate = async () => {
    if (!userPrompt && files.length === 0) {
      setError('Please provide a prompt or upload some files to start.');
      return;
    }
    setError(null);
    setBuildScript(null);
    setOsConcept(null);
    setIsLoading(true);

    try {
      const result = await generateOsConcept(userPrompt, files);
      setOsConcept(result);
    } catch (e) {
      const err = e as Error;
      setError(`Concept generation failed: ${err.message}`);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBuild = async (concept: OSConcept) => {
    setError(null);
    setIsBuilding(true);
    setBuildScript(null);

    try {
        const script = await generateBuildScript(concept);
        setBuildScript(script);
    } catch (e) {
        const err = e as Error;
        setError(`Build script generation failed: ${err.message}`);
        console.error(e);
    } finally {
        setIsBuilding(false);
    }
  };

  const WelcomeScreen = () => (
    <div className="text-center p-8 animate-fade-in">
      <div className="flex justify-center items-center gap-4 mb-4">
        <NexusLogo className="w-48 h-auto" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-2">Welcome to Nexus</h2>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Describe your ideal operating system, upload inspirational files, and let AI craft a detailed conceptual OS and simulate its creation.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8 flex flex-col items-center">
            <NexusLogo className="w-40 sm:w-56 h-auto mb-2" />
          <p className="mt-2 text-gray-400">Conceptualize and simulate a Linux-based OS with the power of Gemini</p>
        </header>

        <main className="space-y-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-2xl shadow-cyan-500/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label htmlFor="prompt" className="block text-lg font-medium text-cyan-300">
                  1. Describe Your OS
                </label>
                <textarea
                  id="prompt"
                  rows={4}
                  className="w-full bg-gray-900/70 border border-gray-600 rounded-md p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow"
                  placeholder="e.g., A lightweight OS for old hardware, focused on privacy and writing."
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-4">
                 <label className="block text-lg font-medium text-cyan-300">
                  2. Add Context Files (Optional)
                </label>
                <FileUpload files={files} onFilesChange={handleFilesChange} />
              </div>
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={handleGenerate}
                disabled={isLoading || isBuilding}
                className="inline-flex items-center justify-center px-8 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-500 text-gray-900 font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Spinner className="w-5 h-5 mr-3" />
                    Generating Concept...
                  </>
                ) : (
                  <>
                    <AIIcon className="w-5 h-5 mr-3" />
                    Generate My OS Concept
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="mt-8">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg text-center mb-6">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}

            <div className="mt-6 space-y-8">
              {isLoading && (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/30 rounded-lg border border-dashed border-gray-700">
                      <Spinner className="w-12 h-12 text-cyan-400 mb-4" />
                      <h3 className="text-xl font-semibold text-white">Architecting your OS concept...</h3>
                      <p className="text-gray-400">The AI is interpreting your ideas and designing the system.</p>
                  </div>
              )}
              {!isLoading && !osConcept && !error && <WelcomeScreen />}
              
              {osConcept && <OsDisplay concept={osConcept} onBuild={handleBuild} isBuilding={isBuilding} buildScript={buildScript} />}

              {buildScript && osConcept && <Terminal script={buildScript} codename={osConcept.codename} />}
            </div>
          </div>
        </main>
      </div>
       <footer className="w-full max-w-5xl mx-auto text-center mt-12 pb-4">
          <p className="text-sm text-gray-500">
            Powered by Google Gemini. This is a conceptual tool; no actual OS is created.
          </p>
        </footer>
    </div>
  );
};

export default App;
