import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import nodemailer from 'nodemailer';

const emailPlugin: FastifyPluginAsync = async (fastify) => {
  // Create a transporter only if SMTP config exists; otherwise fallback to logger
  let transporter: nodemailer.Transporter | null = null;

  if (fastify.config.SMTP_HOST && fastify.config.SMTP_PORT) {
    transporter = nodemailer.createTransport({
      host: fastify.config.SMTP_HOST,
      port: Number(fastify.config.SMTP_PORT),
      secure: false, // allow STARTTLS by default
      auth: fastify.config.SMTP_USER ? {
        user: fastify.config.SMTP_USER,
        pass: fastify.config.SMTP_PASS
      } : undefined
    });

    // verify transporter in dev to log connection issues
    transporter.verify().then(() => {
      fastify.log.info('Email transporter verified');
    }).catch((err: any) => {
      fastify.log.warn({ err }, 'Email transporter verification failed');
    });
  } else {
    fastify.log.info('SMTP not configured, emails will be logged to console');
  }

  fastify.decorate('sendEmail', async function (to: string, subject: string, html: string, text?: string) {
    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: fastify.config.SMTP_USER || 'no-reply@example.com',
          to,
          subject,
          text: text || html.replace(/<[^>]+>/g, ''),
          html
        });
        fastify.log.info({ to, messageId: info.messageId }, 'Email sent');
        return info;
      } catch (err) {
        fastify.log.error({ err }, 'Failed to send email');
        throw err;
      }
    }

    // Fallback: log email contents for development/testing
    fastify.log.info({ to, subject, html, text }, 'Email (logged)');
    return { logged: true };
  });
};

export default fp(emailPlugin, { name: 'email', dependencies: ['config'] });

// Type augmentation
declare module 'fastify' {
  interface FastifyInstance {
    sendEmail(to: string, subject: string, html: string, text?: string): Promise<any>;
  }
}
