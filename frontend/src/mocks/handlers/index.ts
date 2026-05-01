import { healthHandlers } from './health';
import { vocHandlers } from './voc';
import { mastersHandlers } from './masters';
import { notificationsHandlers } from './notifications';

export const handlers = [
  ...healthHandlers,
  ...vocHandlers,
  ...mastersHandlers,
  ...notificationsHandlers,
];
