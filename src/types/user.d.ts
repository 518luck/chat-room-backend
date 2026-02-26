import type { Request } from 'express';

export interface JwtUserData {
  userId: number;
  username: string;
}

export interface RequestWithUser extends Request {
  user: JwtUserData;
}
