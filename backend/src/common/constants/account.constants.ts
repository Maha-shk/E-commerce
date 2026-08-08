/**
 * Password hash written to placeholder accounts — those created as a side
 * effect of something other than signing up (today: a contact-form submission,
 * which needs a `User` row because `Conversation.customerId` is required).
 *
 * It is deliberately NOT a bcrypt hash: `bcrypt.compare` returns false against
 * any string that isn't one, so a placeholder can never be signed into no
 * matter what is guessed. The sentinel value just makes the intent greppable
 * instead of leaving a random string in the column.
 */
export const UNCLAIMED_PASSWORD_HASH = 'unclaimed-account:no-password-set';

/**
 * A placeholder is an account nobody has signed up for yet.
 *
 * Registration is allowed to claim one instead of rejecting the address, which
 * is what stops a contact-form submission from permanently blocking the real
 * owner from creating an account. All three conditions matter:
 *
 *  - `termsAcceptedAt: null` — `register` always stamps this, so a real signup
 *    (even an unverified one) never matches.
 *  - `emailVerified: false` — nobody has proven ownership of the mailbox.
 *  - `passwordHash` is the sentinel — no usable credential was ever set.
 *
 * Claiming still requires passing the emailed OTP, so only whoever controls the
 * mailbox can complete it.
 */
export function isUnclaimedAccount(user: {
  termsAcceptedAt: Date | null;
  emailVerified: boolean;
  passwordHash: string;
}): boolean {
  return (
    user.termsAcceptedAt === null &&
    !user.emailVerified &&
    user.passwordHash === UNCLAIMED_PASSWORD_HASH
  );
}
