import React from 'react';

/**
 * HAI3 Logo Text Icon
 * App-level branding text used by Menu layout component
 */
export const HAI3LogoTextIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 24"
      fill="currentColor"
    >
      <text x="0" y="18" fontSize="16" fontWeight="bold" fontFamily="system-ui, -apple-system, sans-serif">Cyber-Wiki</text>
    </svg>
  );
};
