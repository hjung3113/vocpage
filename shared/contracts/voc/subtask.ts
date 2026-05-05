import { z } from 'zod';
import { VocStatus } from './entity';

export const SubTaskItem = z.object({
  id: z.string(),
  title: z.string(),
  status: VocStatus,
});
export type SubTaskItem = z.infer<typeof SubTaskItem>;

export const SubTaskListResponse = z.object({
  rows: z.array(SubTaskItem),
});
export type SubTaskListResponse = z.infer<typeof SubTaskListResponse>;
