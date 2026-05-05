import { healthHandlers } from './health';
import { vocHandlers } from './voc';
import { mastersHandlers } from './masters';
import { notificationsHandlers } from './notifications';
import { authHandlers } from './auth';

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...vocHandlers,
  ...mastersHandlers,
  ...notificationsHandlers,
];
