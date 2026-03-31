/**
 * CommentsPanel - Side panel showing line comments (expressive-code inspired)
 * Screen-local component for home screen
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ScrollArea,
  Badge,
  Input,
  Separator,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@hai3/uikit';
import { useTranslation } from '@hai3/react';
import { TextLoader } from '@/app/components/TextLoader';
import type { GitComment, GitCommentReply } from '../../../types/gitTypes';
import { DEMO_SCREENSET_ID, GIT_SCREEN_ID } from '../../../ids';

interface CommentsPanelProps {
  comments: GitComment[];
  activeCommentId: number | null;
  cursorLine: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onResolve: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onReply: (commentId: number, reply: GitCommentReply) => void;
  onActiveChange: (commentId: number | null) => void;
  onAddComment: (line: number, body: string) => void;
  newCommentLine: number | null;
  onCancelNewComment: () => void;
  onStartNewComment: (line: number) => void;
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  comments,
  activeCommentId,
  onResolve,
  onDelete,
  onReply,
  onActiveChange,
  onAddComment,
  newCommentLine,
  onCancelNewComment,
  cursorLine,
  collapsed,
  onToggleCollapse,
  onStartNewComment,
}) => {
  const { t } = useTranslation();
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const safeComments = Array.isArray(comments) ? comments : [];
  const activeComments = safeComments.filter((c) => c.status === 'active');
  const resolvedComments = safeComments.filter((c) => c.status === 'resolved');

  const handleReply = useCallback(
    (commentId: number) => {
      if (!replyText.trim()) return;
      const reply: GitCommentReply = {
        id: Date.now(),
        body: replyText,
        user: {
          login: 'you',
          id: 0,
          avatar_url: '',
          html_url: '',
        },
        created_at: new Date().toISOString(),
      };
      onReply(commentId, reply);
      setReplyText('');
      setReplyingTo(null);
    },
    [replyText, onReply]
  );

  const handleAddComment = useCallback(() => {
    if (!newCommentText.trim() || newCommentLine === null) return;
    onAddComment(newCommentLine, newCommentText);
    setNewCommentText('');
  }, [newCommentText, newCommentLine, onAddComment]);

  if (collapsed) {
    return (
      <div className="flex h-full w-10 flex-col items-center border-l border-border py-2 gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-[10px]"
          onClick={onToggleCollapse}
          title="Expand comments"
        >
          ◀
        </Button>
        <Badge variant="secondary" className="text-[8px] px-1">
          {activeComments.length}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex h-full w-80 flex-col border-l border-border">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 shrink-0 p-0 text-[10px]"
          onClick={onToggleCollapse}
          title="Collapse comments"
        >
          ▶
        </Button>
        <TextLoader skeletonClassName="h-5 w-24">
          <h3 className="text-sm font-semibold">
            {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:comments.title`)}
          </h3>
        </TextLoader>
        <Badge variant="secondary" className="text-[10px]">
          {activeComments.length}
        </Badge>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto h-6 text-[10px]"
          onClick={() => onStartNewComment(cursorLine)}
          title={`Add comment on line ${cursorLine}`}
        >
          + Line {cursorLine}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-2">
          {/* New comment form */}
          {newCommentLine !== null && (
            <Card className="border-primary">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs">
                  {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:comments.new_comment_line`, { line: String(newCommentLine) })}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-3 pt-1">
                <Input
                  placeholder={t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:comments.placeholder`)}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                  className="text-xs"
                />
                <div className="flex gap-1">
                  <Button size="sm" className="h-6 text-[10px]" onClick={handleAddComment}>
                    {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:comments.add`)}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[10px]"
                    onClick={onCancelNewComment}
                  >
                    {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:comments.cancel`)}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active comments */}
          {activeComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              isActive={comment.id === activeCommentId}
              replyingTo={replyingTo}
              replyText={replyText}
              onActivate={() => onActiveChange(comment.id)}
              onResolve={() => onResolve(comment.id)}
              onDelete={() => onDelete(comment.id)}
              onStartReply={() => setReplyingTo(comment.id)}
              onReplyTextChange={setReplyText}
              onSubmitReply={() => handleReply(comment.id)}
              onCancelReply={() => setReplyingTo(null)}
            />
          ))}

          {/* Resolved comments */}
          {resolvedComments.length > 0 && (
            <>
              <Separator />
              <span className="px-1 text-[10px] text-muted-foreground">
                {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:comments.resolved_count`, { count: String(resolvedComments.length) })}
              </span>
              {resolvedComments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  isActive={false}
                  replyingTo={null}
                  replyText=""
                  onActivate={() => onActiveChange(comment.id)}
                  onResolve={() => {}}
                  onDelete={() => onDelete(comment.id)}
                  onStartReply={() => {}}
                  onReplyTextChange={() => {}}
                  onSubmitReply={() => {}}
                  onCancelReply={() => {}}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

CommentsPanel.displayName = 'CommentsPanel';

/**
 * Individual comment card
 */
interface CommentCardProps {
  comment: GitComment;
  isActive: boolean;
  replyingTo: number | null;
  replyText: string;
  onActivate: () => void;
  onResolve: () => void;
  onDelete: () => void;
  onStartReply: () => void;
  onReplyTextChange: (text: string) => void;
  onSubmitReply: () => void;
  onCancelReply: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
  comment,
  isActive,
  replyingTo,
  replyText,
  onActivate,
  onResolve,
  onDelete,
  onStartReply,
  onReplyTextChange,
  onSubmitReply,
  onCancelReply,
}) => {
  const isReplying = replyingTo === comment.id;

  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      } ${comment.status === 'resolved' ? 'opacity-60' : ''}`}
      onClick={onActivate}
    >
      <CardContent className="flex flex-col gap-2 p-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={comment.user.avatar_url} />
            <AvatarFallback className="text-[8px]">
              {comment.user.login[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">{comment.user.login}</span>
          <Badge
            variant={comment.status === 'active' ? 'default' : 'secondary'}
            className="ml-auto text-[8px]"
          >
            L{comment.line}
            {comment.lineEnd !== comment.line ? `-${comment.lineEnd}` : ''}
          </Badge>
        </div>

        {/* Body */}
        <p className="text-xs text-foreground/80">{comment.body}</p>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="ml-4 flex flex-col gap-1.5 border-l border-border pl-2">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-muted-foreground">
                  {reply.user.login}
                </span>
                <p className="text-[11px] text-foreground/70">{reply.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        {isReplying && (
          <div className="flex flex-col gap-1">
            <Input
              placeholder="Reply..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmitReply()}
              className="h-7 text-[10px]"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                className="h-5 text-[9px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onSubmitReply();
                }}
              >
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-5 text-[9px]"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelReply();
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {comment.status === 'active' && !isReplying && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-[9px]"
              onClick={(e) => {
                e.stopPropagation();
                onStartReply();
              }}
            >
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-[9px]"
              onClick={(e) => {
                e.stopPropagation();
                onResolve();
              }}
            >
              Resolve
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 text-[9px] text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

CommentCard.displayName = 'CommentCard';
