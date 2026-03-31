/**
 * CommentPopup - Floating popup for comments when panel is collapsed
 * Shows existing comments for a line + new comment form
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  Input,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Separator,
} from '@hai3/uikit';
import type { GitComment, GitCommentReply } from '../../../types/gitTypes';

interface CommentPopupProps {
  comments: GitComment[];
  line: number;
  newCommentLine: number | null;
  onAddComment: (line: number, body: string) => void;
  onReply: (commentId: number, reply: GitCommentReply) => void;
  onResolve: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onClose: () => void;
}

export const CommentPopup: React.FC<CommentPopupProps> = ({
  comments,
  line,
  newCommentLine,
  onAddComment,
  onReply,
  onResolve,
  onDelete,
  onClose,
}) => {
  const [newText, setNewText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const handleAdd = useCallback(() => {
    if (!newText.trim()) return;
    onAddComment(line, newText);
    setNewText('');
  }, [newText, line, onAddComment]);

  const handleReply = useCallback(
    (commentId: number) => {
      if (!replyText.trim()) return;
      const reply: GitCommentReply = {
        id: Date.now(),
        body: replyText,
        user: { login: 'you', id: 0, avatar_url: '', html_url: '' },
        created_at: new Date().toISOString(),
      };
      onReply(commentId, reply);
      setReplyText('');
      setReplyingTo(null);
    },
    [replyText, onReply]
  );

  const hasComments = comments.length > 0;
  const showNewForm = newCommentLine === line;

  return (
    <div className="absolute right-4 top-16 z-50 w-80 animate-in fade-in slide-in-from-right-2">
      <Card className="shadow-lg border-primary/20">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">Line {line}</span>
            {hasComments && (
              <Badge variant="secondary" className="text-[8px]">
                {comments.length}
              </Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-[10px]"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        <CardContent className="flex max-h-80 flex-col gap-2 overflow-y-auto p-3">
          {/* Existing comments */}
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="flex flex-col gap-1.5 rounded-md border border-border p-2"
            >
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={comment.user.avatar_url} />
                  <AvatarFallback className="text-[8px]">
                    {comment.user.login[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{comment.user.login}</span>
              </div>
              <p className="text-xs text-foreground/80">{comment.body}</p>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-3 flex flex-col gap-1 border-l border-border pl-2">
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
              {replyingTo === comment.id ? (
                <div className="flex flex-col gap-1">
                  <Input
                    placeholder="Reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                    className="h-7 text-[10px]"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button size="sm" className="h-5 text-[9px]" onClick={() => handleReply(comment.id)}>
                      Reply
                    </Button>
                    <Button size="sm" variant="ghost" className="h-5 text-[9px]" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="h-5 text-[9px]" onClick={() => setReplyingTo(comment.id)}>
                    Reply
                  </Button>
                  {comment.status === 'active' && (
                    <Button size="sm" variant="ghost" className="h-5 text-[9px]" onClick={() => onResolve(comment.id)}>
                      Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-5 text-[9px] text-destructive" onClick={() => onDelete(comment.id)}>
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}

          {hasComments && showNewForm && <Separator />}

          {/* New comment form */}
          {showNewForm && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground">New comment</span>
              <Input
                placeholder="Write a comment..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="h-8 text-xs"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-[10px]" onClick={handleAdd}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* If no comments and no new form, show prompt */}
          {!hasComments && !showNewForm && (
            <p className="py-2 text-center text-xs text-muted-foreground">
              No comments on this line
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

CommentPopup.displayName = 'CommentPopup';
