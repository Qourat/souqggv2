export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface SendEmailResult {
  id: string | null;
  delivered: boolean;
}

export interface MailerAdapter {
  id: "resend" | "noop";
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
