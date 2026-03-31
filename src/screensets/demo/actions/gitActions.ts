/**
 * git Actions
 * Emit events AND interact with APIs (Flux pattern)
 * Following Flux: Actions emit events for effects to update Redux, and call APIs
 */

import { eventBus, apiRegistry } from '@hai3/react';
import { RepoEvents } from '../events/repoEvents';
import { FileEvents } from '../events/fileEvents';
import { CommentEvents } from '../events/commentEvents';
import { GitApiService } from '../api/gitApiService';
import type { GitViewMode, GitComment, GitCommentReply } from '../types/gitTypes';

/**
 * Repository actions
 */
export const loadRepository = (): void => {
  void apiRegistry.getService(GitApiService).getRepository().then((repository) => {
    eventBus.emit(RepoEvents.RepositoryLoaded, { repository });
  }).catch((err) => {
    console.warn('[git] loadRepository failed:', err);
  });
};

export const loadTree = (path: string): void => {
  eventBus.emit(RepoEvents.PathNavigated, { path });
  void apiRegistry.getService(GitApiService).getTree(path).then((entries) => {
    eventBus.emit(RepoEvents.TreeLoaded, { entries });
  }).catch((err) => {
    console.warn('[git] loadTree failed:', err);
  });
};

export const loadBranches = (): void => {
  void apiRegistry.getService(GitApiService).getBranches().then((branches) => {
    eventBus.emit(RepoEvents.BranchesLoaded, { branches });
  }).catch((err) => {
    console.warn('[git] loadBranches failed:', err);
  });
};

export const selectBranch = (branch: string): void => {
  eventBus.emit(RepoEvents.BranchSelected, { branch });
};

/**
 * File actions
 */
export const selectFile = (path: string): void => {
  eventBus.emit(FileEvents.FileSelected, { path });
  void apiRegistry.getService(GitApiService).getFileContent(path).then((file) => {
    eventBus.emit(FileEvents.FileLoaded, { file });
    loadComments(path);
  }).catch((err) => {
    console.warn('[git] selectFile failed:', err);
  });
};

export const changeViewMode = (mode: GitViewMode): void => {
  eventBus.emit(FileEvents.ViewModeChanged, { mode });
};

export const editContent = (content: string): void => {
  eventBus.emit(FileEvents.ContentEdited, { content });
};

export const saveFile = (path: string, content: string): void => {
  eventBus.emit(FileEvents.FileSaved, { path, content });
};

/**
 * Comment actions
 */
export const loadComments = (path: string): void => {
  void apiRegistry.getService(GitApiService).getComments(path).then((comments) => {
    eventBus.emit(CommentEvents.CommentsLoaded, { comments });
  }).catch((err) => {
    console.warn('[git] loadComments failed:', err);
  });
};

export const addNewComment = (comment: GitComment): void => {
  eventBus.emit(CommentEvents.CommentAdded, { comment });
};

export const resolveExistingComment = (commentId: number): void => {
  eventBus.emit(CommentEvents.CommentResolved, { commentId });
};

export const deleteExistingComment = (commentId: number): void => {
  eventBus.emit(CommentEvents.CommentDeleted, { commentId });
};

export const addCommentReply = (commentId: number, reply: GitCommentReply): void => {
  eventBus.emit(CommentEvents.ReplyAdded, { commentId, reply });
};

export const setActiveComment = (commentId: number | null): void => {
  eventBus.emit(CommentEvents.ActiveCommentChanged, { commentId });
};
