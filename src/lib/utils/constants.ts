import { DateTime } from './datetime';

export const SYSTEM_CONSTANTS = {
  get CURRENT_TIME(): string {
    return DateTime.getCurrentTime();
  },
  CURRENT_USER: 'drhousevicodine'
} as const;