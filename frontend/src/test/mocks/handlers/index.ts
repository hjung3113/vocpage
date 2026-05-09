import { healthHandlers } from './health';
import { vocHandlers } from './voc';
import { mastersHandlers } from './masters';
import { notificationsHandlers } from './notifications';
import { authHandlers } from './auth';
import { noticeHandlers } from './notice';
import { faqHandlers } from './faq';
import { faqCategoryHandlers } from './faq-categories';
import { adminTagsHandlers } from './admin-tags';
import { adminTrashHandlers } from './admin-trash';
import { adminUsersHandlers } from './admin-users';

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...vocHandlers,
  ...mastersHandlers,
  ...notificationsHandlers,
  ...noticeHandlers,
  ...faqHandlers,
  ...faqCategoryHandlers,
  ...adminTagsHandlers,
  ...adminTrashHandlers,
  ...adminUsersHandlers,
];
