/**
 * Repository domain events
 */

import '@hai3/react';
import type { GitRepository, GitTreeEntry, GitBranch } from '../types/gitTypes';

const DOMAIN_ID = 'repo';
void DOMAIN_ID;

export enum RepoEvents {
  RepositoryLoaded = 'demo/repo/repositoryLoaded',
  TreeLoaded = 'demo/repo/treeLoaded',
  BranchesLoaded = 'demo/repo/branchesLoaded',
  BranchSelected = 'demo/repo/branchSelected',
  PathNavigated = 'demo/repo/pathNavigated',
}

declare module '@hai3/react' {
  interface EventPayloadMap {
    [RepoEvents.RepositoryLoaded]: { repository: GitRepository };
    [RepoEvents.TreeLoaded]: { entries: GitTreeEntry[] };
    [RepoEvents.BranchesLoaded]: { branches: GitBranch[] };
    [RepoEvents.BranchSelected]: { branch: string };
    [RepoEvents.PathNavigated]: { path: string };
  }
}
