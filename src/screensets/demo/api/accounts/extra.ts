/**
 * User Extra Properties
 * Platform-specific user fields via module augmentation
 */

import '@/app/api';

declare module '@/app/api' {
  interface UserExtra {
    department: string;
  }
}
