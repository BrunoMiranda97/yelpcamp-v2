import { Request, Response, NextFunction, RequestHandler } from "express";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Express 4 does not forward rejected promises to the error handler; this wrapper does.
export const asyncHandler =
  <R extends Request = Request>(fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req as R, res, next).catch(next);
  };
