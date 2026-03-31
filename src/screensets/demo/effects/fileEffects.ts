/**
 * File Effects
 * Listen to file events and update fileSlice
 */

import { type AppDispatch, eventBus } from '@hai3/react';
import { FileEvents } from '../events/fileEvents';
import type { GitFileContent, GitViewMode } from '../types/gitTypes';
import {
  setCurrentFile,
  setViewMode,
  setEditedContent,
  setFileLoading,
  setFileSaving,
} from '../slices/fileSlice';

export const initializeFileEffects = (dispatch: AppDispatch): void => {
  eventBus.on(FileEvents.FileLoaded, ({ file }: { file: GitFileContent }) => {
    dispatch(setCurrentFile(file));
  });

  eventBus.on(FileEvents.FileSelected, () => {
    dispatch(setFileLoading(true));
  });

  eventBus.on(FileEvents.ViewModeChanged, ({ mode }: { mode: GitViewMode }) => {
    dispatch(setViewMode(mode));
  });

  eventBus.on(FileEvents.ContentEdited, ({ content }: { content: string }) => {
    dispatch(setEditedContent(content));
  });

  eventBus.on(FileEvents.FileSaved, () => {
    dispatch(setFileSaving(false));
  });
};
