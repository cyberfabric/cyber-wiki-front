/**
 * FileHeader - Header bar with file path, branch selector, and view mode toggle
 * Screen-local component for home screen
 */

import React from 'react';
import { Button, Badge } from '@hai3/uikit';
import { useTranslation } from '@hai3/react';
import { TextLoader } from '@/app/components/TextLoader';
import type { GitFileContent, GitViewMode, GitBranch, GitRepository } from '../../../types/gitTypes';
import { DEMO_SCREENSET_ID, GIT_SCREEN_ID } from '../../../ids';

interface FileHeaderProps {
  file: GitFileContent | null;
  viewMode: GitViewMode;
  branches: GitBranch[];
  currentBranch: string;
  hasChanges: boolean;
  repository: GitRepository | null;
  onViewModeChange: (mode: GitViewMode) => void;
  onSave: () => void;
  onBranchSelect: (branch: string) => void;
}

export const FileHeader: React.FC<FileHeaderProps> = ({
  file,
  viewMode,
  branches,
  currentBranch,
  hasChanges,
  repository,
  onViewModeChange,
  onSave,
  onBranchSelect,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-2">
      {/* Branch selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:file_header.branch`)}:
        </span>
        <select
          className="rounded border border-border bg-background px-2 py-0.5 text-xs"
          value={currentBranch}
          onChange={(e) => onBranchSelect(e.target.value)}
        >
          {(Array.isArray(branches) ? branches : []).map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}
              {b.protected ? ' 🔒' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* File path */}
      {file && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">/</span>
          <TextLoader skeletonClassName="h-4 w-48">
            <span className="text-sm font-mono">{file.path}</span>
          </TextLoader>
          <Badge variant="secondary" className="text-[10px]">
            {file.language}
          </Badge>
        </div>
      )}

      {/* Repository name */}
      {repository && (
        <span className="text-xs text-muted-foreground">
          {repository.full_name}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* View mode toggle */}
        <div className="flex rounded-md border border-border">
          <Button
            variant={viewMode === 'read' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 rounded-r-none text-xs"
            onClick={() => onViewModeChange('read')}
          >
            <TextLoader skeletonClassName="h-4 w-12" inheritColor>
              {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:file_header.read`)}
            </TextLoader>
          </Button>
          <Button
            variant={viewMode === 'edit' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 rounded-l-none text-xs"
            onClick={() => onViewModeChange('edit')}
          >
            <TextLoader skeletonClassName="h-4 w-12" inheritColor>
              {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:file_header.edit`)}
            </TextLoader>
          </Button>
        </div>

        {/* Save button (visible in edit mode with changes) */}
        {viewMode === 'edit' && hasChanges && (
          <Button size="sm" className="h-7 text-xs" onClick={onSave}>
            <TextLoader skeletonClassName="h-4 w-12" inheritColor>
              {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:file_header.save`)}
            </TextLoader>
          </Button>
        )}
      </div>
    </div>
  );
};

FileHeader.displayName = 'FileHeader';
