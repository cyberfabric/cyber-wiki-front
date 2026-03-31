/**
 * RepoHeader - Repository info header with stats
 * Screen-local component for home screen
 */

import React from 'react';
import { Badge, Avatar, AvatarImage, AvatarFallback } from '@hai3/uikit';
import { useTranslation } from '@hai3/react';
import { TextLoader } from '@/app/components/TextLoader';
import type { GitRepository } from '../../../types/gitTypes';
import { DEMO_SCREENSET_ID, GIT_SCREEN_ID } from '../../../ids';

interface RepoHeaderProps {
  repository: GitRepository | null;
  loading: boolean;
}

export const RepoHeader: React.FC<RepoHeaderProps> = ({ repository, loading }) => {
  const { t } = useTranslation();

  if (loading || !repository) {
    return (
      <div className="flex items-center gap-4 border-b border-border bg-muted/20 px-4 py-3">
        <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
        <div className="flex flex-col gap-1">
          <div className="h-5 w-48 animate-pulse rounded bg-muted" />
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 border-b border-border bg-muted/20 px-4 py-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={repository.owner?.avatar_url} />
        <AvatarFallback>{repository.owner?.login?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <TextLoader skeletonClassName="h-5 w-48">
            <h2 className="text-sm font-bold">{repository.full_name}</h2>
          </TextLoader>
          {repository.private && (
            <Badge variant="secondary" className="text-[10px]">
              {t(`screen.${DEMO_SCREENSET_ID}.${GIT_SCREEN_ID}:repo.private`)}
            </Badge>
          )}
        </div>
        <TextLoader skeletonClassName="h-3 w-64">
          <p className="text-xs text-muted-foreground">{repository.description}</p>
        </TextLoader>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <StatBadge label="⭐" value={repository.stargazers_count} />
        <StatBadge label="🍴" value={repository.forks_count} />
        <StatBadge label="🐛" value={repository.open_issues_count} />
        {(Array.isArray(repository.topics) ? repository.topics : []).map((topic) => (
          <Badge key={topic} variant="outline" className="text-[10px]">
            {topic}
          </Badge>
        ))}
      </div>
    </div>
  );
};

RepoHeader.displayName = 'RepoHeader';

interface StatBadgeProps {
  label: string;
  value: number;
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, value }) => (
  <span className="flex items-center gap-1 text-xs text-muted-foreground">
    {label} {value.toLocaleString()}
  </span>
);

StatBadge.displayName = 'StatBadge';
