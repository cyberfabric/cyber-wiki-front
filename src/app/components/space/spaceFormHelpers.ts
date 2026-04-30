/**
 * Space form helpers
 *
 * Validators and derivation logic shared by Create/Edit space flows. Kept
 * outside the modals so they can be unit-tested independently.
 */

import { kebabCase, last, startCase, trim } from 'lodash';
import type { CreateSpaceRequest } from '@/app/api';

export const SPACE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface SpaceFieldErrors {
  git_repository_url?: string;
  name?: string;
  slug?: string;
  description?: string;
  git_default_branch?: string;
}

/** Validate a Git repository URL. Accepts HTTPS / HTTP / SSH-style URLs. */
export function validateRepoUrl(raw: string): string | undefined {
  const trimmed = trim(raw);
  if (!trimmed) return 'Repository URL is required';
  if (/^https?:\/\/\S+$/i.test(trimmed)) return undefined;
  if (/^ssh:\/\/\S+$/i.test(trimmed)) return undefined;
  if (/^[^@\s]+@[^:\s]+:\S+$/.test(trimmed)) return undefined;
  return 'Use a full HTTPS URL (https://…) or SSH form (git@host:org/repo.git)';
}

/**
 * Run all validations against the form state. Returns a map of field →
 * message; an empty map means the form can be submitted.
 */
export function validateSpaceForm(
  form: CreateSpaceRequest,
  existingSlugs: Set<string>,
): SpaceFieldErrors {
  const errors: SpaceFieldErrors = {};

  const urlError = validateRepoUrl(form.git_repository_url ?? '');
  if (urlError) errors.git_repository_url = urlError;

  const name = trim(form.name);
  if (!name) {
    errors.name = 'Name is required';
  } else if (name.length > 100) {
    errors.name = 'Keep the name under 100 characters';
  }

  const slug = trim(form.slug);
  if (!slug) {
    errors.slug = 'Space key is required';
  } else if (slug.length < 2) {
    errors.slug = 'Space key must be at least 2 characters';
  } else if (slug.length > 60) {
    errors.slug = 'Keep the space key under 60 characters';
  } else if (!SPACE_SLUG_RE.test(slug)) {
    errors.slug = 'Use lowercase letters, digits, and single hyphens only';
  } else if (existingSlugs.has(slug)) {
    errors.slug = 'A space with this key already exists';
  }

  const desc = trim(form.description ?? '');
  if (desc.length > 500) {
    errors.description = 'Keep the description under 500 characters';
  }

  const branch = trim(form.git_default_branch ?? '');
  if (branch && /\s/.test(branch)) {
    errors.git_default_branch = "Branch name can't contain spaces";
  }

  return errors;
}

/**
 * Extract a sensible repo "leaf" from a Git URL — the last meaningful path
 * segment, with `.git` stripped. Works for HTTPS URLs (GitHub, Bitbucket
 * Server, GitLab) and SSH-style `git@host:org/repo.git`.
 *
 * Returns `''` when nothing useful can be derived.
 */
export function deriveRepoLeaf(rawUrl: string): string {
  const trimmed = trim(rawUrl);
  if (!trimmed) return '';
  // Normalize SSH form so URL parsing works: `git@host:org/repo.git`
  // → `ssh://git@host/org/repo.git`.
  const sshNormalized = trimmed.replace(/^([^@\s]+@[^:\s]+):(?!\/\/)/, 'ssh://$1/');
  let pathname: string;
  try {
    pathname = new URL(sshNormalized).pathname;
  } catch {
    pathname = sshNormalized;
  }
  const segments = pathname.split('/').filter(Boolean);
  const leaf = last(segments) ?? '';
  return leaf.replace(/\.git$/i, '');
}

/** Suggested slug derived from a repo URL leaf. */
export function deriveSpaceSlug(repoLeaf: string): string {
  return kebabCase(repoLeaf);
}

/** Suggested human-readable name derived from a repo URL leaf. */
export function deriveSpaceName(repoLeaf: string): string {
  return startCase(repoLeaf);
}
