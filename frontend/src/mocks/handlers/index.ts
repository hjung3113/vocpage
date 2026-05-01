import { healthHandlers } from './health';
import { vocHandlers } from './voc';

export const handlers = [...healthHandlers, ...vocHandlers];
