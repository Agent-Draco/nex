import React from 'react';

// This component assumes 'nexus-logo.png' is available in the public folder.
// The user prompt indicated "I have it in the folder" and the name is "Nexus Logo.png".
// We are using a web-friendly name and path.
const logoSrc = "/nexus-logo.png";

const NexusLogo: React.FC<{ className?: string }> = ({ className }) => (
  <img src={logoSrc} alt="Nexus Logo" className={className} style={{ filter: 'drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))' }} />
);

export default NexusLogo;
