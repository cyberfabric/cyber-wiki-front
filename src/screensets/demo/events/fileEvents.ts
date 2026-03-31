/**
 * File domain events
 */

import '@hai3/react';
import type { GitFileContent, GitViewMode } from '../types/gitTypes';

const DOMAIN_ID = 'file';
void DOMAIN_ID;

export enum FileEvents {
  FileLoaded = 'demo/file/fileLoaded',
  FileSelected = 'demo/file/fileSelected',
  ViewModeChanged = 'demo/file/viewModeChanged',
  ContentEdited = 'demo/file/contentEdited',
  FileSaved = 'demo/file/fileSaved',
}

declare module '@hai3/react' {
  interface EventPayloadMap {
    [FileEvents.FileLoaded]: { file: GitFileContent };
    [FileEvents.FileSelected]: { path: string };
    [FileEvents.ViewModeChanged]: { mode: GitViewMode };
    [FileEvents.ContentEdited]: { content: string };
    [FileEvents.FileSaved]: { path: string; content: string };
  }
}
