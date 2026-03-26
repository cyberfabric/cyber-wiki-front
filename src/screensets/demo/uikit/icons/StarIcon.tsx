import React from 'react';

/**
 * Star Icon ID
 * Well-known constant defined where it belongs
 * @public Reserved for future icon registry usage
 */
export const STAR_ICON_ID = 'star';

/**
 * Star Icon
 * Local icon for Demo screenset (UI Kit Elements screen - Button block)
 */
export const StarIcon: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
};
