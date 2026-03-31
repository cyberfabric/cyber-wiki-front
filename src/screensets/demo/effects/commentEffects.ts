/**
 * Comment Effects
 * Listen to comment events and update commentSlice
 */

import { type AppDispatch, eventBus } from '@hai3/react';
import { CommentEvents } from '../events/commentEvents';
import type { GitComment, GitCommentReply } from '../types/gitTypes';
import {
  setComments,
  addComment,
  resolveComment,
  deleteComment,
  addReply,
  setActiveCommentId,
} from '../slices/commentSlice';

export const initializeCommentEffects = (dispatch: AppDispatch): void => {
  eventBus.on(CommentEvents.CommentsLoaded, ({ comments }: { comments: GitComment[] }) => {
    dispatch(setComments(comments));
  });

  eventBus.on(CommentEvents.CommentAdded, ({ comment }: { comment: GitComment }) => {
    dispatch(addComment(comment));
  });

  eventBus.on(CommentEvents.CommentResolved, ({ commentId }: { commentId: number }) => {
    dispatch(resolveComment(commentId));
  });

  eventBus.on(CommentEvents.CommentDeleted, ({ commentId }: { commentId: number }) => {
    dispatch(deleteComment(commentId));
  });

  eventBus.on(CommentEvents.ReplyAdded, ({ commentId, reply }: { commentId: number; reply: GitCommentReply }) => {
    dispatch(addReply({ commentId, reply }));
  });

  eventBus.on(CommentEvents.ActiveCommentChanged, ({ commentId }: { commentId: number | null }) => {
    dispatch(setActiveCommentId(commentId));
  });
};
