import { Request, Response, NextFunction } from 'express';
import { mockAuthMiddleware } from '../mockAuth';

const adminUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@company.com',
  name: 'Mock Admin',
  role: 'admin' as const,
};

function makeReq(sessionUser?: typeof adminUser) {
  return { session: { user: sessionUser } } as unknown as Request;
}

function makeRes() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;
  (res.status as jest.Mock).mockReturnValue(res);
  return res;
}

test('attaches req.user and calls next() when session.user exists', () => {
  const req = makeReq(adminUser);
  const res = makeRes();
  const next = jest.fn() as unknown as NextFunction;

  mockAuthMiddleware(req, res, next);

  expect(req.user).toEqual(adminUser);
  expect(next).toHaveBeenCalledTimes(1);
  expect(res.status).not.toHaveBeenCalled();
});

test('returns 401 and does not call next() when no session.user', () => {
  const req = makeReq(undefined);
  const res = makeRes();
  const next = jest.fn() as unknown as NextFunction;

  mockAuthMiddleware(req, res, next);

  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  expect(next).not.toHaveBeenCalled();
});
