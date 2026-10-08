import type { Request, Response, NextFunction } from 'express';
import { clerkMiddleware as clerkExpressMiddleware, getAuth } from '@clerk/express';
import { userRepository, type UserDoc } from '../repositories/user.repository.js';
import { readerProfileRepository, type ReaderProfileDoc } from '../repositories/reader-profile.repository.js';
import { config } from '../config/index.js';

export interface AuthenticatedUserContext {
  clerkUserId: string;
  user: UserDoc;
  readerProfile: ReaderProfileDoc;
}

declare global {
  namespace Express {
    interface Request {
      authContext?: AuthenticatedUserContext;
    }
  }
}

// Clerk middleware wrapper that is safe when Clerk keys are not yet configured (e.g. in unit tests)
export const clerkAuthMiddleware = () => {
  if (!config.clerk?.secretKey) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  return clerkExpressMiddleware({
    publishableKey: config.clerk?.publishableKey,
    secretKey: config.clerk?.secretKey,
  });
};

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  let auth: any = null;
  try {
    auth = getAuth(req);
  } catch {
    // getAuth throws if clerkMiddleware was not registered or no session present
    auth = null;
  }

  if (!auth || !auth.userId) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Valid Clerk authentication token is required.',
      },
    });
    return;
  }

  try {
    const clerkUserId = auth.userId;
    let user = await userRepository.findByClerkUserId(clerkUserId);

    if (!user) {
      // Auto-provision local user on first authenticated interaction
      const email = (auth.sessionClaims?.email as string) || `${clerkUserId}@placeholder.explobook.internal`;
      const displayName = (auth.sessionClaims?.first_name as string) || 'ExploBook Reader';

      user = await userRepository.create({
        clerkUserId,
        email,
        displayName,
      });
    }

    let readerProfile = await readerProfileRepository.findByUserId(user._id!);
    if (!readerProfile) {
      readerProfile = await readerProfileRepository.createDefault(user._id!);
    }

    req.authContext = {
      clerkUserId,
      user,
      readerProfile,
    };
    (req as any).user = user;

    next();
  } catch (err: any) {
    next(err);
  }
}
