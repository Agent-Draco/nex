import React from 'react';
import { OSConcept } from '../types';
import LinuxIcon from './icons/LinuxIcon';
import BuildIcon from './icons/BuildIcon';
import Spinner from './ui/Spinner';

interface OsDisplayProps {
  concept: OSConcept | null;
  onBuild: (concept: OSConcept) => void;
  isBuilding: boolean;
  buildScript: string | null;
}

const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-cyan-400 mb-2 tracking-wider uppercase">{title}</h3>
    <div className="text-gray-300">{children}</div>
  </div>
);

const OsDisplay: React.FC<OsDisplayProps> = ({ concept, onBuild, isBuilding, buildScript }) => {
  if (!concept) return null;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div className="text-center p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
        <h2 className="text-4xl font-bold text-white">{concept.osName}</h2>
        <p className="text-cyan-400 text-lg">Codename: {concept.codename}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Core Philosophy">
          <p className="leading-relaxed">{concept.philosophy}</p>
        </InfoCard>

        <InfoCard title="System Architecture">
          <ul className="space-y-2">
            <li className="flex items-center">
              <LinuxIcon className="w-5 h-5 mr-2 text-cyan-400" />
              <span><strong>Kernel:</strong> {concept.kernelVersion}</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              <span><strong>Desktop:</strong> {concept.desktopEnvironment}</span>
            </li>
            <li className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>
              <span><strong>Shell:</strong> {concept.defaultShell}</span>
            </li>
          </ul>
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard title="Key Features">
          <ul className="list-disc list-inside space-y-1">
            {concept.keyFeatures.map((feature, index) => <li key={index}>{feature}</li>)}
          </ul>
        </InfoCard>

        <InfoCard title="Default Packages">
          <ul className="list-disc list-inside space-y-1">
            {concept.defaultPackages.map((pkg, index) => <li key={index}>{pkg}</li>)}
          </ul>
        </InfoCard>
      </div>
      
      <InfoCard title="Mock Boot Screen">
        <div className="bg-black rounded-md p-4 mt-2">
          <pre className="text-green-400 font-mono text-xs md:text-sm whitespace-pre-wrap break-words">
            {concept.bootScreenAscii}
          </pre>
        </div>
      </InfoCard>

      {!buildScript && (
         <div className="mt-8 text-center">
            <button
              onClick={() => onBuild(concept)}
              disabled={isBuilding}
              className="inline-flex items-center justify-center px-10 py-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-500 text-gray-900 font-bold rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 ease-in-out disabled:cursor-not-allowed"
            >
              {isBuilding ? (
                <>
                  <Spinner className="w-6 h-6 mr-3" />
                  Generating Build Script...
                </>
              ) : (
                <>
                  <BuildIcon className="w-6 h-6 mr-3" />
                  Build This OS
                </>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-2">(This will generate and run a simulated build process in a terminal)</p>
         </div>
      )}
    </div>
  );
};

export default OsDisplay;