import type { Request, Response, NextFunction } from 'express';
import * as service from '../services/voc';
import type { AuthUser } from '../auth/types';

function user(req: Request): AuthUser {
  return req.user as AuthUser;
}

export async function getList(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.list(req.query as unknown as Parameters<typeof service.list>[0]);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.detail(req.params.id as string, user(req));
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function patchVoc(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await service.update(
      req.params.id as string,
      req.body as Parameters<typeof service.update>[1],
      user(req),
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const rows = await service.notes(req.params.id as string, user(req));
    res.json({ rows });
  } catch (err) {
    next(err);
  }
}

export async function postNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { body } = req.body as { body: string };
    const note = await service.addNote(req.params.id as string, body, user(req));
    res.json(note);
  } catch (err) {
    next(err);
  }
}
