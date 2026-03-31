/**
 * git API Mocks
 * Mock data for development and testing
 *
 * Keys use full URL patterns (including baseURL path).
 * Register mocks via MockPlugin in main.tsx or screenset.
 */

import type { MockMap } from '@hai3/react';
import {
  mockRepository,
  mockTreeRoot,
  mockTreeSrc,
  mockBranches,
  mockFiles,
  mockComments,
} from './gitMockData';

/**
 * Mock map for git API service
 */
export const gitMockMap: MockMap = {
  'GET /api/git/repos/current': () => mockRepository,
  'GET /api/git/tree/_root': () => mockTreeRoot,
  'GET /api/git/tree/src': () => mockTreeSrc,
  'GET /api/git/branches': () => mockBranches,

  // File contents — exact keys per encoded path
  'GET /api/git/contents/README.md': () => mockFiles['README.md'],
  'GET /api/git/contents/src%2FApp.tsx': () => mockFiles['src/App.tsx'],
  'GET /api/git/contents/src%2Fmain.tsx': () => mockFiles['src/main.tsx'],
  'GET /api/git/contents/package.json': () => mockFiles['package.json'],

  // Comments — exact keys per encoded path
  'GET /api/git/comments/README.md': () => mockComments['README.md'] ?? [],
  'GET /api/git/comments/src%2FApp.tsx': () => mockComments['src/App.tsx'] ?? [],
  'GET /api/git/comments/src%2Fmain.tsx': () => mockComments['src/main.tsx'] ?? [],
  'GET /api/git/comments/package.json': () => mockComments['package.json'] ?? [],
};
