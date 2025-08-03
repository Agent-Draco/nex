import React from 'react';

const BuildIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" />
    <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
    <path d="M12 4V2" />
    <path d="M12 22v-2" />
    <path d="m16.95 7.05-1.414-1.414" />
    <path d="m8.464 15.536-1.414-1.414" />
    <path d="M7.05 7.05 8.464 8.464" />
    <path d="m15.536 15.536 1.414 1.414" />
  </svg>
);

export default BuildIcon;
