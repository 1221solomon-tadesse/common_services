import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
@Injectable()
export class EmailService {
  private readonly transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_EMAIL'),
        pass: this.configService.get<string>('GMAIL_PASSWORD'),
      },
    });
  }
  async sendMail(to: string, subject: string, text: string, html: string) {
    await this.transporter.sendMail({
      from: `"${this.configService.get<string>('FROM_NAME')}" <${this.configService.get<string>('GMAIL_EMAIL')}>`,
      to,
      subject,
      text,
      html,
    });
  }
}
