import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Sends transactional email over SMTP.
 *
 * If SMTP_HOST is not configured the service runs in "console mode": messages
 * are logged instead of sent, so the OTP / password-reset flows are fully
 * testable locally without an email provider.
 */
@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter?: nodemailer.Transporter;
  private from!: string;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const host = this.config.get<string>('mail.host');
    this.from = this.config.get<string>('mail.from')!;

    if (!host) {
      this.logger.warn(
        'SMTP_HOST not set — running in console mode. Emails will be logged, not sent.',
      );
      return;
    }

    const port = this.config.get<number>('mail.port') ?? 587;
    this.transporter = nodemailer.createTransport({
      host,
      port,
      // Port 465 uses implicit TLS; other ports use STARTTLS.
      secure: port === 465,
      auth: {
        user: this.config.get<string>('mail.user'),
        pass: this.config.get<string>('mail.password'),
      },
    });
    this.logger.log(`SMTP transport ready (${host}:${port})`);
  }

  private async send(to: string, subject: string, text: string, html: string) {
    if (!this.transporter) {
      this.logger.log(
        `\n──────── EMAIL (console mode) ────────\nTo:      ${to}\nSubject: ${subject}\n\n${text}\n──────────────────────────────────────`,
      );
      return;
    }
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      this.logger.log(`Sent "${subject}" to ${to}`);
    } catch (err) {
      // Never let a mail failure break the calling request.
      this.logger.error(`Failed to send "${subject}" to ${to}`, err as Error);
    }
  }

  /** 6-digit code emailed after registration. */
  async sendVerificationCode(to: string, name: string, code: string) {
    const subject = 'Verify your CENTO account';
    const text = `Hi ${name},\n\nYour CENTO verification code is: ${code}\n\nIt expires in 10 minutes.`;
    await this.send(
      to,
      subject,
      text,
      `<p>Hi ${name},</p><p>Your CENTO verification code is:</p>
       <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
       <p>It expires in 10 minutes.</p>`,
    );
  }

  /**
   * Support reply emailed to a customer when an admin answers their message.
   *
   * Without this the reply only ever existed in the admin console — it was
   * written to the database and the customer was never told.
   */
  async sendSupportReply(
    to: string,
    name: string,
    replyText: string,
    originalText?: string,
  ) {
    const subject = 'Re: your message to CENTO';
    const quoted = originalText
      ? `\n\n---\nYour original message:\n${originalText}`
      : '';

    const text = `Hi ${name},\n\n${replyText}${quoted}\n\n— The CENTO team`;

    await this.send(
      to,
      subject,
      text,
      `<p>Hi ${escapeHtml(name)},</p>
       <p style="white-space:pre-wrap">${escapeHtml(replyText)}</p>
       ${
         originalText
           ? `<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0" />
              <p style="color:#666;font-size:13px">Your original message:</p>
              <blockquote style="color:#666;font-size:13px;white-space:pre-wrap;margin:0;padding-left:12px;border-left:3px solid #e5e5e5">${escapeHtml(originalText)}</blockquote>`
           : ''
       }
       <p>— The CENTO team</p>`,
    );
  }

  /**
   * Sent when a product someone asked about comes back into stock.
   *
   * Deliberately urgent about quantity when it is low: the whole reason this
   * mail exists is that the item ran out once already, and "3 left" is the
   * difference between a useful alert and an annoying one.
   */
  async sendBackInStock(to: string, productName: string, stock: number) {
    const subject = `Back in stock: ${productName}`;
    const scarcity =
      stock > 0 && stock <= 10
        ? ` Only ${stock} left, so it may not last long.`
        : '';

    const text =
      `Good news — "${productName}" is available again.${scarcity}\n\n` +
      `You asked to be told when it returned, so this is that email. ` +
      `We will not write again about this item unless you ask us to.`;

    await this.send(
      to,
      subject,
      text,
      `<p>Good news — <strong>${escapeHtml(productName)}</strong> is available again.${escapeHtml(scarcity)}</p>
       <p>You asked to be told when it returned, so this is that email.
          We won't write again about this item unless you ask us to.</p>
       <p>— The CENTO team</p>`,
    );
  }

  /** 6-digit code emailed for a password reset request. */
  async sendPasswordResetCode(to: string, name: string, code: string) {
    const subject = 'Reset your CENTO password';
    const text = `Hi ${name},\n\nYour CENTO password reset code is: ${code}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.`;
    await this.send(
      to,
      subject,
      text,
      `<p>Hi ${name},</p><p>Your CENTO password reset code is:</p>
       <p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p>
       <p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    );
  }
}

/**
 * Minimal HTML escaping for values interpolated into an email body.
 *
 * Reply text is admin-authored and customer names are user-supplied, so both
 * reach the template as untrusted strings.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
