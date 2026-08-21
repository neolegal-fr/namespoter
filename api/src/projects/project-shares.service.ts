import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { ProjectShare, SharePermission } from './entities/project-share.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { KeycloakAdminService } from './keycloak-admin.service';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

@Injectable()
export class ProjectSharesService {
  private readonly logger = new Logger(ProjectSharesService.name);

  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    @InjectRepository(ProjectShare) private readonly shares: Repository<ProjectShare>,
    private readonly mail: MailService,
    private readonly keycloak: KeycloakAdminService,
    private readonly config: ConfigService,
  ) {}

  /** Le partage se gère depuis le projet : seul son propriétaire y touche. */
  private async projetDe(projectId: string, owner: User): Promise<Project> {
    const project = await this.projects.findOne({ where: { id: projectId }, relations: { user: true } });
    if (!project) throw new NotFoundException('Projet non trouvé');
    if (project.user?.id !== owner.id) throw new ForbiddenException('Seul le propriétaire du projet peut gérer ses partages');
    return project;
  }

  async list(projectId: string, owner: User): Promise<ProjectShare[]> {
    await this.projetDe(projectId, owner);
    return this.shares.find({ where: { project: { id: projectId } }, order: { createdAt: 'DESC' } });
  }

  /**
   * Invite une adresse sur un projet.
   *
   * Ré-inviter la même adresse mettra à jour le droit et le message plutôt que
   * d'échouer : c'est ainsi qu'on fait passer quelqu'un de la lecture à
   * l'écriture, et c'est le geste qu'on tente naturellement.
   */
  async invite(
    projectId: string,
    owner: User,
    ownerSub: string,
    data: { email: string; permission?: SharePermission; message?: string },
  ): Promise<{ share: ProjectShare; courrielEnvoye: boolean }> {
    const project = await this.projetDe(projectId, owner);

    const email = (data.email ?? '').trim().toLowerCase();
    if (!EMAIL.test(email)) throw new BadRequestException('Adresse e-mail invalide');
    if (email === (owner.email ?? '').toLowerCase()) {
      throw new BadRequestException('Ce projet est déjà le vôtre');
    }

    const permission: SharePermission = data.permission === 'write' ? 'write' : 'read';
    // Borné : ce texte part dans un courriel et s'affiche dans une liste.
    const message = (data.message ?? '').trim().slice(0, 500) || null;

    let share = await this.shares.findOne({ where: { project: { id: projectId }, email } });
    if (share) {
      share.permission = permission;
      share.message = message;
      share.invitedBySub = ownerSub;
    } else {
      share = this.shares.create({ project, email, permission, message, invitedBySub: ownerSub, acceptedAt: null });
    }
    share = await this.shares.save(share);

    // Le compte d'abord, le courriel ensuite : le nôtre invite à se connecter,
    // celui de Keycloak permet de choisir son mot de passe. Dans cet ordre,
    // l'invité trouve les deux dans sa boîte, et le second lui sert de porte.
    /*
     * Le lien porte l'adresse invitée ET l'écran où l'envoyer : connexion si
     * elle a déjà un compte, inscription sinon. L'invité n'a donc aucun choix à
     * faire, et surtout aucun mot de passe à connaître — il le CHOISIT à
     * l'inscription, comme n'importe quel nouvel utilisateur.
     *
     * On ne provisionne plus le compte : un compte créé d'office n'a pas de
     * mot de passe, ce qui obligeait à faire transiter la porte d'entrée par un
     * second courriel signé de Keycloak. Une invitation, un message, un écran.
     */
    const dejaInscrit = await this.keycloak.compteExiste(email);
    const lien = `${this.origine()}/projects/${project.id}`
      + `?invite=${encodeURIComponent(email)}${dejaInscrit ? '' : '&nouveau=1'}`;
    const courrielEnvoye = await this.envoyerInvitation({
      email, project, owner, permission, message, lien, dejaInscrit,
    });

    /*
     * L'accès est accordé même si le courriel n'part pas — la ligne existe, la
     * personne pourra ouvrir le projet dès qu'elle se connectera. Mais le
     * propriétaire doit l'APPRENDRE : sans cela, il voit « invitation envoyée »,
     * l'autre ne reçoit rien, et personne ne comprend pourquoi. C'est exactement
     * ce qui s'est produit le 21/08/2026 en développement, une variable SMTP
     * détournée suffisant à rendre la fonctionnalité muette.
     */
    if (!courrielEnvoye) {
      this.logger.warn(`Invitation enregistrée mais courriel non envoyé à ${email} (projet ${project.id})`);
    }

    return { share, courrielEnvoye };
  }

  async revoke(projectId: string, owner: User, shareId: string): Promise<void> {
    await this.projetDe(projectId, owner);
    const share = await this.shares.findOne({ where: { id: shareId, project: { id: projectId } } });
    if (!share) throw new NotFoundException('Partage non trouvé');
    await this.shares.remove(share);
  }

  /**
   * Adresse publique du produit, pour fabriquer le lien d'invitation.
   *
   * `FRONTEND_URL` est la variable déjà en place partout (Stripe, courriels) :
   * en introduire une seconde pour la même chose garantissait qu'un jour l'une
   * des deux serait oubliée sur le serveur, et que le lien pointerait vers
   * localhost dans un courriel envoyé à un tiers.
   */
  private origine(): string {
    return (this.config.get<string>('FRONTEND_URL') ?? 'https://namorama.com').replace(/\/$/, '');
  }

  private async envoyerInvitation(p: {
    email: string;
    project: Project;
    owner: User;
    permission: SharePermission;
    message: string | null;
    lien: string;
    /** Cette adresse a-t-elle déjà un compte Namorama ? */
    dejaInscrit: boolean;
  }): Promise<boolean> {
    const qui = [p.owner.firstName, p.owner.lastName].filter(Boolean).join(' ') || p.owner.email || 'Un utilisateur de Namorama';
    const droit = p.permission === 'write'
      ? 'Vous pouvez consulter le projet et y lancer des recherches.'
      : 'Vous pouvez consulter le projet, sans le modifier.';
    /*
     * Deux situations, deux consignes. L'invité ne sait pas s'il a un compte
     * chez nous ; le message le lui dit, et le bouton l'amène sur le bon écran.
     */
    const compte = p.dejaInscrit
      ? '<p style="margin:0 0 12px"><strong>Vous avez déjà un compte avec cette adresse</strong> — connectez-vous, il n\'y a rien à créer.</p>'
      : `<p style="margin:0 0 12px">Vous n'avez pas encore de compte : le bouton ci-dessous ouvre la création, où vous choisirez votre mot de passe. <strong>Utilisez bien cette adresse (${escapeHtml(p.email)})</strong> — c'est elle qui porte l'accès au projet.</p>`;

    const mot = p.message
      ? `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid #0d7a4e;background:#f4f7f5;color:#2c3532">${escapeHtml(p.message)}</blockquote>`
      : '';

    return this.mail.send({
      to: p.email,
      subject: `${qui} partage un projet Namorama avec vous`,
      html: `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0b0e10;max-width:560px">
  <p style="margin:0 0 12px"><strong>${escapeHtml(qui)}</strong> vous donne accès au projet <strong>${escapeHtml(p.project.name || 'sans titre')}</strong> sur Namorama.</p>
  ${mot}
  <p style="margin:0 0 12px">${droit}</p>
  ${compte}
  <p style="margin:20px 0"><a href="${p.lien}" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#0d7a4e;color:#fff;text-decoration:none;font-weight:700">${p.dejaInscrit ? 'Ouvrir le projet' : 'Créer mon compte et ouvrir le projet'}</a></p>
  <p style="margin:0;font-size:13px;color:#5c6663">Si vous ne savez pas pourquoi vous recevez ce message, ignorez-le : sans connexion, ce lien ne donne accès à rien.</p>
</div>`,
    });
  }
}

function escapeHtml(v: string): string {
  return v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
