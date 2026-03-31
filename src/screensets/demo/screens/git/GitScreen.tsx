/**
 * Git Screen
 * Code viewer screen within the demo screenset
 * Orchestrates: RepoHeader, FileExplorer, FileHeader, CodeViewer/CodeEditor, CommentsPanel
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useScreenTranslations,
  I18nRegistry,
  Language,
  useAppSelector,
} from '@hai3/react';
import { DEMO_SCREENSET_ID, GIT_SCREEN_ID } from '../../ids';
import { selectRepoState } from '../../slices/repoSlice';
import { selectFileState } from '../../slices/fileSlice';
import { selectCommentState } from '../../slices/commentSlice';
import {
  loadRepository,
  loadTree,
  loadBranches,
  selectFile,
  selectBranch,
  changeViewMode,
  editContent,
  saveFile,
  setActiveComment,
  resolveExistingComment,
  deleteExistingComment,
  addCommentReply,
  addNewComment,
} from '../../actions/gitActions';
import type { GitViewMode, GitComment, GitCommentReply } from '../../types/gitTypes';
import { FileExplorer } from './components/FileExplorer';
import { FileHeader } from './components/FileHeader';
import { CommentsPanel } from './components/CommentsPanel';
import { CommentPopup } from './components/CommentPopup';
import { CodeViewer } from '../../uikit/composite/CodeViewer';
import { CodeEditor } from '../../uikit/composite/CodeEditor';

/**
 * Screen-level translations (loaded lazily when screen mounts)
 */
const translations = I18nRegistry.createLoader({
  [Language.English]: () => import('./i18n/en.json'),
  [Language.Arabic]: () => import('./i18n/ar.json'),
  [Language.Bengali]: () => import('./i18n/bn.json'),
  [Language.Czech]: () => import('./i18n/cs.json'),
  [Language.Danish]: () => import('./i18n/da.json'),
  [Language.German]: () => import('./i18n/de.json'),
  [Language.Greek]: () => import('./i18n/el.json'),
  [Language.Spanish]: () => import('./i18n/es.json'),
  [Language.Persian]: () => import('./i18n/fa.json'),
  [Language.Finnish]: () => import('./i18n/fi.json'),
  [Language.French]: () => import('./i18n/fr.json'),
  [Language.Hebrew]: () => import('./i18n/he.json'),
  [Language.Hindi]: () => import('./i18n/hi.json'),
  [Language.Hungarian]: () => import('./i18n/hu.json'),
  [Language.Indonesian]: () => import('./i18n/id.json'),
  [Language.Italian]: () => import('./i18n/it.json'),
  [Language.Japanese]: () => import('./i18n/ja.json'),
  [Language.Korean]: () => import('./i18n/ko.json'),
  [Language.Malay]: () => import('./i18n/ms.json'),
  [Language.Dutch]: () => import('./i18n/nl.json'),
  [Language.Norwegian]: () => import('./i18n/no.json'),
  [Language.Polish]: () => import('./i18n/pl.json'),
  [Language.Portuguese]: () => import('./i18n/pt.json'),
  [Language.Romanian]: () => import('./i18n/ro.json'),
  [Language.Russian]: () => import('./i18n/ru.json'),
  [Language.Swedish]: () => import('./i18n/sv.json'),
  [Language.Swahili]: () => import('./i18n/sw.json'),
  [Language.Tamil]: () => import('./i18n/ta.json'),
  [Language.Thai]: () => import('./i18n/th.json'),
  [Language.Tagalog]: () => import('./i18n/tl.json'),
  [Language.Turkish]: () => import('./i18n/tr.json'),
  [Language.Ukrainian]: () => import('./i18n/uk.json'),
  [Language.Urdu]: () => import('./i18n/ur.json'),
  [Language.Vietnamese]: () => import('./i18n/vi.json'),
  [Language.ChineseSimplified]: () => import('./i18n/zh.json'),
  [Language.ChineseTraditional]: () => import('./i18n/zh-TW.json'),
});

/**
 * Git Screen Component
 * Orchestrates all sub-components for the git code viewer
 */
export const GitScreen: React.FC = () => {
  useScreenTranslations(DEMO_SCREENSET_ID, GIT_SCREEN_ID, translations);

  const repoState = useAppSelector(selectRepoState);
  const fileState = useAppSelector(selectFileState);
  const commentState = useAppSelector(selectCommentState);

  const [newCommentLine, setNewCommentLine] = useState<number | null>(null);
  const [scrollTarget, setScrollTarget] = useState<{ line: number; tick: number } | null>(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [popupLine, setPopupLine] = useState<number | null>(null);

  // Safe accessors — guard against unexpected state shapes
  const safeTree = Array.isArray(repoState.tree) ? repoState.tree : [];
  const safeBranches = Array.isArray(repoState.branches) ? repoState.branches : [];
  const safeComments = useMemo(
    () => (Array.isArray(commentState.comments) ? commentState.comments : []),
    [commentState.comments]
  );

  // Load initial data
  useEffect(() => {
    loadRepository();
    loadBranches();
    loadTree('');
  }, []);

  const handleFileSelect = useCallback((path: string) => {
    selectFile(path);
    setNewCommentLine(null);
  }, []);

  const handleDirectorySelect = useCallback((path: string) => {
    loadTree(path);
  }, []);

  const handleNavigateUp = useCallback(() => {
    const parentPath = repoState.currentPath.includes('/')
      ? repoState.currentPath.substring(0, repoState.currentPath.lastIndexOf('/'))
      : '';
    loadTree(parentPath);
  }, [repoState.currentPath]);

  const handleViewModeChange = useCallback((mode: GitViewMode) => {
    changeViewMode(mode);
  }, []);

  const handleEditContent = useCallback((content: string) => {
    editContent(content);
  }, []);

  const handleSave = useCallback(() => {
    if (fileState.currentFile) {
      saveFile(fileState.currentFile.path, fileState.editedContent);
    }
  }, [fileState.currentFile, fileState.editedContent]);

  const handleBranchSelect = useCallback((branch: string) => {
    selectBranch(branch);
    loadTree('');
  }, []);

  const handleCommentClick = useCallback((commentId: number | null) => {
    setActiveComment(commentId);
    if (commentId == null) return;
    const comment = safeComments.find((c) => c.id === commentId);
    if (comment) {
      setScrollTarget({ line: comment.line, tick: Date.now() });
      if (panelCollapsed) {
        setPopupLine(comment.line);
      }
    }
  }, [safeComments, panelCollapsed]);

  const handleLineClick = useCallback((line: number) => {
    if (panelCollapsed) {
      setPopupLine(line);
      setNewCommentLine(line);
    } else {
      setNewCommentLine(line);
    }
  }, [panelCollapsed]);

  const handleAddComment = useCallback(
    (line: number, body: string) => {
      const comment: GitComment = {
        id: Date.now(),
        body,
        line,
        lineEnd: line,
        path: fileState.currentFile?.path ?? '',
        user: { login: 'you', id: 0, avatar_url: '', html_url: '' },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        replies: [],
      };
      addNewComment(comment);
      setNewCommentLine(null);
    },
    [fileState.currentFile]
  );

  const handleReply = useCallback((commentId: number, reply: GitCommentReply) => {
    addCommentReply(commentId, reply);
  }, []);

  const hasChanges =
    fileState.currentFile !== null &&
    fileState.editedContent !== fileState.currentFile.content;

  return (
    <div className="flex h-full flex-col">
      {/* File header (branch, path, view mode, repo name) */}
      <FileHeader
        file={fileState.currentFile}
        viewMode={fileState.viewMode}
        branches={safeBranches}
        currentBranch={repoState.currentBranch}
        hasChanges={hasChanges}
        repository={repoState.repository}
        onViewModeChange={handleViewModeChange}
        onSave={handleSave}
        onBranchSelect={handleBranchSelect}
      />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File explorer sidebar */}
        <div className="w-56 shrink-0">
          <FileExplorer
            entries={safeTree}
            currentPath={repoState.currentPath}
            loading={repoState.loading}
            onFileSelect={handleFileSelect}
            onDirectorySelect={handleDirectorySelect}
            onNavigateUp={handleNavigateUp}
          />
        </div>

        {/* Code area */}
        <div className="flex-1 overflow-hidden">
          {fileState.currentFile ? (
            fileState.viewMode === 'read' ? (
              <CodeViewer
                value={fileState.currentFile.content}
                language={fileState.currentFile.language}
                comments={safeComments}
                scrollToLine={scrollTarget}
                onCommentClick={handleCommentClick}
                onLineClick={handleLineClick}
                onCursorLineChange={setCursorLine}
              />
            ) : (
              <CodeEditor
                value={fileState.editedContent}
                language={fileState.currentFile.language}
                onChange={handleEditContent}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a file to view</p>
            </div>
          )}
        </div>

        {/* Comments panel (visible in read mode when file is loaded) */}
        {fileState.currentFile && fileState.viewMode === 'read' && (
          <CommentsPanel
            comments={safeComments}
            activeCommentId={commentState.activeCommentId}
            cursorLine={cursorLine}
            collapsed={panelCollapsed}
            onToggleCollapse={() => setPanelCollapsed((v) => !v)}
            onResolve={resolveExistingComment}
            onDelete={deleteExistingComment}
            onReply={handleReply}
            onActiveChange={handleCommentClick}
            onAddComment={handleAddComment}
            newCommentLine={newCommentLine}
            onCancelNewComment={() => setNewCommentLine(null)}
            onStartNewComment={(line) => {
              if (panelCollapsed) {
                setPopupLine(line);
                setNewCommentLine(line);
              } else {
                setNewCommentLine(line);
              }
            }}
          />
        )}

        {/* Floating comment popup when panel is collapsed */}
        {panelCollapsed && popupLine !== null && fileState.currentFile && fileState.viewMode === 'read' && (
          <CommentPopup
            comments={safeComments.filter((c) => c.line <= popupLine! && c.lineEnd >= popupLine!)}
            line={popupLine}
            newCommentLine={newCommentLine}
            onAddComment={handleAddComment}
            onReply={handleReply}
            onResolve={resolveExistingComment}
            onDelete={deleteExistingComment}
            onClose={() => { setPopupLine(null); setNewCommentLine(null); }}
          />
        )}
      </div>
    </div>
  );
};

GitScreen.displayName = 'GitScreen';

// Default export for lazy loading
export default GitScreen;
