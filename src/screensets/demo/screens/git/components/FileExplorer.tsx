/**
 * FileExplorer - Tree view of repository files
 * Screen-local component for home screen
 */

import React from 'react';
import { ScrollArea, Button } from '@hai3/uikit';
import { useTranslation } from '@hai3/react';
import { TextLoader } from '@/app/components/TextLoader';
import type { GitTreeEntry } from '../../../types/gitTypes';
import { DEMO_SCREENSET_ID, GIT_SCREEN_ID } from '../../../ids';

interface FileExplorerProps {
  entries: GitTreeEntry[];
  currentPath: string;
  loading: boolean;
  onFileSelect: (path: string) => void;
  onDirectorySelect: (path: string) => void;
  onNavigateUp: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  entries,
  currentPath,
  loading,
  onFileSelect,
  onDirectorySelect,
  onNavigateUp,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col border-r border-border">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <TextLoader skeletonClassName="h-5 w-24">
          <h3 className="text-sm font-semibold">
            {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:file_explorer.title`)}
          </h3>
        </TextLoader>
      </div>

      {currentPath && (
        <Button
          variant="ghost"
          className="mx-2 mt-1 justify-start text-xs"
          onClick={onNavigateUp}
        >
          ← ..
        </Button>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              {entries.map((entry) => (
                <Button
                  key={entry.path}
                  variant="ghost"
                  className="h-7 justify-start gap-2 px-2 text-xs"
                  onClick={() =>
                    entry.type === 'dir'
                      ? onDirectorySelect(entry.path)
                      : onFileSelect(entry.path)
                  }
                >
                  <span className="shrink-0">
                    {entry.type === 'dir' ? '📁' : '📄'}
                  </span>
                  <span className="truncate">{entry.name}</span>
                  {entry.type === 'file' && entry.size > 0 && (
                    <span className="ml-auto text-muted-foreground">
                      {formatSize(entry.size)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

FileExplorer.displayName = 'FileExplorer';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}
