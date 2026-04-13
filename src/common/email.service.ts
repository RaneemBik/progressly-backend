/**
 * email.service.ts — SMTP Email Service
 *
 * Sends project invitation emails using Nodemailer.
 *
 * sendProjectInvite(params) behaviour:
 *  - If SMTP env vars are missing: logs a warning + the invite link, returns
 *    WITHOUT throwing. Invites still work — users just don't get an email.
 *  - If SMTP is configured but sending fails: logs the error and continues.
 *    The invite record is preserved in the database.
 *  - If SMTP succeeds: sends a formatted HTML email with an accept button.
 *
 * Non-fatal design is intentional: SMTP configuration should never block the
 * core invite functionality. The invite link is always logged to stdout as
 * a fallback.
 *
 * Reads config from env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {}

  async sendProjectInvite(params: {
    to: string;
    projectName: string;
    role: 'admin' | 'member';
    inviteLink: string;
  }) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    const from = this.configService.get<string>('SMTP_FROM', 'no-reply@progressly.app');

    // If SMTP is not configured, log the invite link and continue without throwing
    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured — invite email skipped.');
      this.logger.log(`[INVITE LINK] ${params.to}: ${params.inviteLink}`);
      return; // ← non-fatal: invite is still saved to DB
    }

    const subject = `You're invited to join "${params.projectName}" on Progressly`;

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:560px">
        <h2 style="color:#2D6352">You've been invited!</h2>
        <p>Hello,</p>
        <p>You have been invited to join the project <strong>"${params.projectName}"</strong> as <strong>${params.role}</strong>.</p>
        <p style="margin:24px 0">
          <a href="${params.inviteLink}"
             style="background:#2D6352;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
            Accept Invitation
          </a>
        </p>
        <p style="color:#666;font-size:13px">
          If the button doesn't work, paste this link into your browser:<br/>
          <a href="${params.inviteLink}" style="color:#2D6352">${params.inviteLink}</a>
        </p>
        <p style="color:#666;font-size:13px">
          Don't have an account? Register with this email address first, then click the link above.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">— Progressly Team</p>
      </div>
    `;

    try {
      const transporter = nodemailer.createTransport({
        host, port,
        secure: port === 465,
        auth: { user, pass },
      });

      await transporter.sendMail({
        from, to: params.to, subject,
        text: `You're invited to join "${params.projectName}" as ${params.role}.\n\nAccept: ${params.inviteLink}`,
        html,
      });

      this.logger.log(`Invite email sent to ${params.to}`);
    } catch (err) {
      // Don't crash the invite flow if email fails — just log it
      this.logger.error(`Failed to send invite email to ${params.to}: ${((err as any).message || 'unknown error')}`);
      this.logger.log(`[INVITE LINK FALLBACK] ${params.to}: ${params.inviteLink}`);
    }
  }
}
