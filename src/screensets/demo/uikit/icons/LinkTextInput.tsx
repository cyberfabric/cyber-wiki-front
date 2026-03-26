import React from 'react';
import { Input } from '@hai3/uikit';

export type LinkTextInputProps = Omit<React.ComponentProps<typeof Input>, 'type'>;

/**
 * LinkTextInput Component
 * Text input component with monospace font styling for displaying links/URLs
 */
export const LinkTextInput: React.FC<LinkTextInputProps> = ({
  className = '',
  ...props
}) => {
  return (
    <Input
      type="text"
      className={`font-mono text-sm ${className}`.trim()}
      {...props}
    />
  );
};
