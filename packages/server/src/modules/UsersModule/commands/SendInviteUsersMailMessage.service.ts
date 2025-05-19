import { Mail } from '@/modules/Mail/Mail';
import { MailTransporter } from '@/modules/Mail/MailTransporter.service';
import { SystemUser } from '@/modules/System/models/SystemUser';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ModelObject } from 'objection';
import path from 'path';

@Injectable()
export class SendInviteUsersMailMessage {
  constructor(
    private readonly mailTransporter: MailTransporter,
    private readonly tenancyContext: TenancyContext,
    private readonly configService: ConfigService,
  ) {}
  /**
   * Sends invite mail to the given email.
   * @param user
   * @param invite
   */
  async sendInviteMail(fromUser: ModelObject<SystemUser>, invite: any) {
    const tenant = await this.tenancyContext.getTenant(true);
    const root = path.join(global.__views_dir, '/images/bigcapital.png');
    const baseURL = this.configService.get('baseURL');

    const mail = new Mail()
      .setSubject(`${fromUser.firstName} has invited you to join a Bigcapital`)
      .setView('mail/UserInvite.html')
      .setTo(invite.email)
      .setAttachments([
        {
          filename: 'bigcapital.png',
          path: root,
          cid: 'bigcapital_logo',
        },
      ])
      .setData({
        root,
        acceptUrl: `${baseURL}/auth/invite/${invite.token}/accept`,
        fullName: `${fromUser.firstName} ${fromUser.lastName}`,
        firstName: fromUser.firstName,
        lastName: fromUser.lastName,
        email: fromUser.email,
        organizationName: tenant.metadata.name,
      });
    this.mailTransporter.send(mail);
  }
}
