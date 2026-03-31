/**
 * File Slice
 * State for current file content, view mode, and editing
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@hai3/react';
// Slice key prefix — kept as 'git' for unique namespacing within demo
import type { GitFileContent, GitViewMode } from '../types/gitTypes';

const SLICE_KEY = 'demo/file' as const;

export interface FileState {
  currentFile: GitFileContent | null;
  viewMode: GitViewMode;
  editedContent: string;
  loading: boolean;
  saving: boolean;
}

const initialState: FileState = {
  currentFile: null,
  viewMode: 'read',
  editedContent: '',
  loading: false,
  saving: false,
};

export const fileSlice = createSlice({
  name: SLICE_KEY,
  initialState,
  reducers: {
    setCurrentFile: (state, action: PayloadAction<GitFileContent>) => {
      state.currentFile = action.payload;
      state.editedContent = action.payload.content;
      state.loading = false;
    },
    setViewMode: (state, action: PayloadAction<GitViewMode>) => {
      state.viewMode = action.payload;
    },
    setEditedContent: (state, action: PayloadAction<string>) => {
      state.editedContent = action.payload;
    },
    setFileLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setFileSaving: (state, action: PayloadAction<boolean>) => {
      state.saving = action.payload;
    },
    clearFile: (state) => {
      state.currentFile = null;
      state.editedContent = '';
      state.viewMode = 'read';
    },
  },
});

export const {
  setCurrentFile,
  setViewMode,
  setEditedContent,
  setFileLoading,
  setFileSaving,
  clearFile,
} = fileSlice.actions;

export default fileSlice;

declare module '@hai3/react' {
  interface RootState {
    [SLICE_KEY]: FileState;
  }
}

export const selectFileState = (state: RootState): FileState => {
  return state[SLICE_KEY] ?? initialState;
};
