/**
 * Repository Effects
 * Listen to repo events and update repoSlice
 */

import { type AppDispatch, eventBus } from '@hai3/react';
import { RepoEvents } from '../events/repoEvents';
import type { GitRepository, GitTreeEntry, GitBranch } from '../types/gitTypes';
import {
  setRepository,
  setTree,
  setBranches,
  setCurrentBranch,
  setCurrentPath,
  setLoading,
} from '../slices/repoSlice';

export const initializeRepoEffects = (dispatch: AppDispatch): void => {
  eventBus.on(RepoEvents.RepositoryLoaded, ({ repository }: { repository: GitRepository }) => {
    dispatch(setRepository(repository));
  });

  eventBus.on(RepoEvents.TreeLoaded, ({ entries }: { entries: GitTreeEntry[] }) => {
    dispatch(setTree(entries));
  });

  eventBus.on(RepoEvents.BranchesLoaded, ({ branches }: { branches: GitBranch[] }) => {
    dispatch(setBranches(branches));
  });

  eventBus.on(RepoEvents.BranchSelected, ({ branch }: { branch: string }) => {
    dispatch(setCurrentBranch(branch));
    dispatch(setLoading(true));
  });

  eventBus.on(RepoEvents.PathNavigated, ({ path }: { path: string }) => {
    dispatch(setCurrentPath(path));
    dispatch(setLoading(true));
  });
};
