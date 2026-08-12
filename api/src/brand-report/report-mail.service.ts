import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { AppLoggerService } from '../common/logging/app-logger.service';
import type { BrandReport } from './dto/brand-report.types';
import { renderReportHtml, reportFileName } from './report-renderer';

/**
 * Envoie le rapport par email (corps HTML + pièce jointe HTML imprimable).
 *
 * Best-effort : un échec d'envoi ne fait jamais échouer la génération ni ne
 * rembourse silencieusement — il est journalisé, l'affichage du rapport suffit.
 * RGPD : ici l'adresse est celle du compte de l'utilisateur, qui reçoit le
 * rapport qu'il a demandé (livraison, pas prospection). Le consentement de
 * capture d'email sur la landing publique relève d'US-055.
 */
@Injectable()
export class ReportMailService {
  constructor(
    private readonly mail: MailService,
    private readonly events: AppLoggerService,
  ) {}

  /** Envoie le rapport à un ou plusieurs destinataires. Renvoie `true` si l'email est parti. */
  async sendReport(recipients: string | string[] | undefined, report: BrandReport): Promise<boolean> {
    const list = (Array.isArray(recipients) ? recipients : [recipients])
      .map((e) => (e ?? '').trim())
      .filter((e) => e.length > 0);
    const unique = [...new Set(list)];
    if (!unique.length) return false;

    const html = renderReportHtml(report);
    const ok = await this.mail.send({
      to: unique.join(', '),
      subject: `Votre rapport de disponibilité — ${report.name}`,
      html,
      attachments: [{ filename: reportFileName(report), content: html, contentType: 'text/html; charset=utf-8' }],
    });
    this.events.event('brand_report_emailed', { sent: ok, recipients: unique.length });
    return ok;
  }
}
