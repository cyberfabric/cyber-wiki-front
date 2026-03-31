/**
 * git API Service
 * Domain-specific API service for this screenset
 */

import { BaseApiService, RestProtocol, RestMockPlugin, apiRegistry } from '@hai3/react';
import { gitMockMap } from './gitMocks';
import type {
  GitRepository,
  GitTreeEntry,
  GitBranch,
  GitFileContent,
  GitComment,
} from '../types/gitTypes';

/**
 * git API Service
 * Extends BaseApiService with domain-specific methods
 */
export class GitApiService extends BaseApiService {
  constructor() {
    const restProtocol = new RestProtocol();

    super({ baseURL: '/api/git' }, restProtocol);

    // Register mock plugin (framework controls when it's active based on mock mode toggle)
    this.registerPlugin(
      restProtocol,
      new RestMockPlugin({
        mockMap: gitMockMap,
        delay: 100,
      })
    );
  }

  async getRepository(): Promise<GitRepository> {
    return this.protocol(RestProtocol).get<GitRepository>('/repos/current');
  }

  async getTree(path: string): Promise<GitTreeEntry[]> {
    return this.protocol(RestProtocol).get<GitTreeEntry[]>(`/tree/${encodeURIComponent(path || '_root')}`);
  }

  async getBranches(): Promise<GitBranch[]> {
    return this.protocol(RestProtocol).get<GitBranch[]>('/branches');
  }

  async getFileContent(path: string): Promise<GitFileContent> {
    return this.protocol(RestProtocol).get<GitFileContent>(`/contents/${encodeURIComponent(path)}`);
  }

  async getComments(path: string): Promise<GitComment[]> {
    return this.protocol(RestProtocol).get<GitComment[]>(`/comments/${encodeURIComponent(path)}`);
  }
}

// Register API service using class-based registration
apiRegistry.register(GitApiService);
