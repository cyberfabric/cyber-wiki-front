/**
 * Comment domain events
 */

import '@hai3/react';
import type { GitComment, GitCommentReply } from '../types/gitTypes';

const DOMAIN_ID = 'comment';
void DOMAIN_ID;

export enum CommentEvents {
  CommentsLoaded = 'demo/comment/commentsLoaded',
  CommentAdded = 'demo/comment/commentAdded',
  CommentResolved = 'demo/comment/commentResolved',
  CommentDeleted = 'demo/comment/commentDeleted',
  ReplyAdded = 'demo/comment/replyAdded',
  ActiveCommentChanged = 'demo/comment/activeCommentChanged',
}

declare module '@hai3/react' {
  interface EventPayloadMap {
    [CommentEvents.CommentsLoaded]: { comments: GitComment[] };
    [CommentEvents.CommentAdded]: { comment: GitComment };
    [CommentEvents.CommentResolved]: { commentId: number };
    [CommentEvents.CommentDeleted]: { commentId: number };
    [CommentEvents.ReplyAdded]: { commentId: number; reply: GitCommentReply };
    [CommentEvents.ActiveCommentChanged]: { commentId: number | null };
  }
}
