/**
 * Repository Slice
 * State for repository metadata, tree, and branches
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@hai3/react';
// Slice key prefix — kept as 'git' for unique namespacing within demo
import type { GitRepository, GitTreeEntry, GitBranch } from '../types/gitTypes';

const SLICE_KEY = 'demo/repo' as const;

export interface RepoState {
  repository: GitRepository | null;
  tree: GitTreeEntry[];
  branches: GitBranch[];
  currentBranch: string;
  currentPath: string;
  loading: boolean;
}

const initialState: RepoState = {
  repository: null,
  tree: [],
  branches: [],
  currentBranch: 'main',
  currentPath: '',
  loading: false,
};

export const repoSlice = createSlice({
  name: SLICE_KEY,
  initialState,
  reducers: {
    setRepository: (state, action: PayloadAction<GitRepository>) => {
      state.repository = action.payload;
    },
    setTree: (state, action: PayloadAction<GitTreeEntry[]>) => {
      state.tree = action.payload;
      state.loading = false;
    },
    setBranches: (state, action: PayloadAction<GitBranch[]>) => {
      state.branches = action.payload;
    },
    setCurrentBranch: (state, action: PayloadAction<string>) => {
      state.currentBranch = action.payload;
    },
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.currentPath = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setRepository,
  setTree,
  setBranches,
  setCurrentBranch,
  setCurrentPath,
  setLoading,
} = repoSlice.actions;

export default repoSlice;

declare module '@hai3/react' {
  interface RootState {
    [SLICE_KEY]: RepoState;
  }
}

export const selectRepoState = (state: RootState): RepoState => {
  return state[SLICE_KEY] ?? initialState;
};
