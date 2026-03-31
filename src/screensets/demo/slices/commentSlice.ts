/**
 * Comment Slice
 * State for code comments (line-level annotations)
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@hai3/react';
// Slice key prefix — kept as 'git' for unique namespacing within demo
import type { GitComment, GitCommentReply } from '../types/gitTypes';

const SLICE_KEY = 'demo/comment' as const;

export interface CommentState {
  comments: GitComment[];
  activeCommentId: number | null;
  loading: boolean;
}

const initialState: CommentState = {
  comments: [],
  activeCommentId: null,
  loading: false,
};

export const commentSlice = createSlice({
  name: SLICE_KEY,
  initialState,
  reducers: {
    setComments: (state, action: PayloadAction<GitComment[]>) => {
      state.comments = action.payload;
      state.loading = false;
    },
    addComment: (state, action: PayloadAction<GitComment>) => {
      state.comments.push(action.payload);
    },
    resolveComment: (state, action: PayloadAction<number>) => {
      const comment = state.comments.find((c) => c.id === action.payload);
      if (comment) {
        comment.status = 'resolved';
      }
    },
    deleteComment: (state, action: PayloadAction<number>) => {
      state.comments = state.comments.filter((c) => c.id !== action.payload);
    },
    addReply: (state, action: PayloadAction<{ commentId: number; reply: GitCommentReply }>) => {
      const comment = state.comments.find((c) => c.id === action.payload.commentId);
      if (comment) {
        comment.replies.push(action.payload.reply);
      }
    },
    setActiveCommentId: (state, action: PayloadAction<number | null>) => {
      state.activeCommentId = action.payload;
    },
    setCommentLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const {
  setComments,
  addComment,
  resolveComment,
  deleteComment,
  addReply,
  setActiveCommentId,
  setCommentLoading,
} = commentSlice.actions;

export default commentSlice;

declare module '@hai3/react' {
  interface RootState {
    [SLICE_KEY]: CommentState;
  }
}

export const selectCommentState = (state: RootState): CommentState => {
  return state[SLICE_KEY] ?? initialState;
};
