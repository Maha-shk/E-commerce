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
