/**
 * Git Screenset Types
 * GitHub-like data structures for repository, files, and comments
 */

export type GitFileType = 'file' | 'dir';

export type GitFileStatus = 'added' | 'modified' | 'deleted' | 'renamed' | 'unchanged';

export type GitCommentStatus = 'active' | 'resolved' | 'pending';

export type GitViewMode = 'read' | 'edit';

export type GitOwner = {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
};

export type GitRepository = {
  id: number;
  name: string;
  full_name: string;
  owner: GitOwner;
  description: string;
  html_url: string;
  language: string;
  default_branch: string;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  private: boolean;
  topics: string[];
};

export type GitTreeEntry = {
  path: string;
  name: string;
  type: GitFileType;
  size: number;
  sha: string;
};

export type GitFileContent = {
  name: string;
  path: string;
  sha: string;
  size: number;
  content: string;
  encoding: string;
  language: string;
  html_url: string;
};

export type GitComment = {
  id: number;
  body: string;
  line: number;
  lineEnd: number;
  path: string;
  user: GitOwner;
  status: GitCommentStatus;
  created_at: string;
  updated_at: string;
  replies: GitCommentReply[];
};

export type GitCommentReply = {
  id: number;
  body: string;
  user: GitOwner;
  created_at: string;
};

export type GitBranch = {
  name: string;
  sha: string;
  protected: boolean;
};

export type GitCommit = {
  sha: string;
  message: string;
  author: GitOwner;
  date: string;
};
