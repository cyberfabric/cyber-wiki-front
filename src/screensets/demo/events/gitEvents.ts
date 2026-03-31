/**
 * git Events - Re-exports all domain events
 * Domain events are split into: repoEvents, fileEvents, commentEvents
 */

const DOMAIN_ID = 'git';
void DOMAIN_ID;

export { RepoEvents } from './repoEvents';
export { FileEvents } from './fileEvents';
export { CommentEvents } from './commentEvents';
