import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedUser } from '../types/jwt-payload.interface';

/**
 * Populates `request.user` when a valid access token is present, and lets the
 * request through untouched when it is not.
 *
 * Needed for endpoints that serve both signed-in users and guests — the cart
 * above all. Marking those routes `@Public()` makes the global `JwtAuthGuard`
 * short-circuit before passport ever runs, so `request.user` stays undefined
 * even for a signed-in caller. Pairing `@Public()` with this guard restores the
 * identity: the global guard waves the request through, then this one attaches
 * the user if there is one.
 *
 * An invalid or expired token is treated as "no user" rather than an error, so
 * a stale token degrades a signed-in caller to guest behaviour instead of
 * breaking their cart with a 401.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No token, malformed token, expired token, suspended account — all mean
      // "continue as a guest".
    }
    return true;
  }

  /** Never throw: a failed lookup yields `undefined`, not a 401. */
  handleRequest<TUser = AuthenticatedUser | undefined>(
    _err: unknown,
    user: TUser,
  ): TUser {
    return user || (undefined as TUser);
  }
}
