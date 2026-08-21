import { Controller, Get, Param, Patch, Delete, Post, Logger, Body, ParseUUIDPipe, BadRequestException, HttpCode } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectSharesService } from './project-shares.service';
import { SharePermission } from './entities/project-share.entity';
import { AuthenticatedUser } from 'nest-keycloak-connect';
import { UsersService } from '../users/users.service';

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly sharesService: ProjectSharesService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async findAll(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    return this.projectsService.findAllByUser(user);
  }

  /**
   * Projets qu'on m'a partagés.
   *
   * Déclaré AVANT `:id` : sans cela, « shared-with-me » serait lu comme un
   * identifiant de projet et rejeté par le `ParseUUIDPipe`.
   */
  @Get('shared-with-me')
  async sharedWithMe(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    const partages = await this.projectsService.findSharedWith(user);
    return partages.map(({ project, permission, ownerEmail }) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      updatedAt: project.updatedAt,
      permission,
      ownerEmail,
    }));
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    const project = await this.projectsService.findOne(id, user);
    // Le rôle voyage avec le projet : sans lui, le front devrait deviner s'il
    // affiche un projet à soi ou un projet partagé en lecture seule.
    const acces = await this.projectsService.accessFor(id, user);
    return { ...project, role: acces?.role ?? 'read' };
  }

  // ─── Partage ──────────────────────────────────────────────────────────────

  @Get(':id/shares')
  async listShares(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    const shares = await this.sharesService.list(id, user);
    return shares.map((s) => ({
      id: s.id,
      email: s.email,
      permission: s.permission,
      message: s.message,
      createdAt: s.createdAt,
      acceptedAt: s.acceptedAt,
    }));
  }

  @Post(':id/shares')
  async invite(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AuthenticatedUser() keycloakUser: any,
    @Body() body: { email?: string; permission?: SharePermission; message?: string },
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    const { share, courrielEnvoye } = await this.sharesService.invite(id, user, keycloakUser.sub, {
      email: body.email ?? '',
      permission: body.permission,
      message: body.message,
    });
    // `emailSent` remonte jusqu'à l'écran : l'accès est accordé dans les deux
    // cas, mais « invitation envoyée » serait un mensonge si le courriel n'est
    // pas parti, et le propriétaire n'aurait aucune raison de prévenir lui-même.
    return {
      id: share.id, email: share.email, permission: share.permission, message: share.message,
      createdAt: share.createdAt, acceptedAt: share.acceptedAt, emailSent: courrielEnvoye,
    };
  }

  @Delete(':id/shares/:shareId')
  @HttpCode(204)
  async revoke(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('shareId', new ParseUUIDPipe()) shareId: string,
    @AuthenticatedUser() keycloakUser: any,
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    await this.sharesService.revoke(id, user, shareId);
  }

  @Patch(':id')
  async update(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any, @Body() data: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    return this.projectsService.update(id, user, data);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    return this.projectsService.remove(id, user);
  }

  /**
   * Crée un projet à partir d'un NOM, sans description ni recherche.
   *
   * C'est le chemin de qui arrive avec un nom en tête : il ne veut pas
   * décrire un projet, il veut savoir si ce nom est libre. Le projet lui donne
   * un endroit où retrouver la réponse — sans lui, le nom testé n'existe
   * nulle part une fois l'onglet fermé.
   *
   * Aucun débit : rien n'est généré ici. Le contrôle de disponibilité passe
   * par `POST /domain/recheck`, gratuit, et la marque reste à acheter.
   */
  @Post('from-name')
  async fromName(
    @AuthenticatedUser() keycloakUser: any,
    @Body() body: { name?: string; extensions?: string[] },
  ) {
    // `findOrCreate` attend l'IDENTIFIANT, pas l'objet Keycloak : lui passer
    // l'objet créait un utilisateur fantôme à chaque appel, et le projet
    // n'appartenait alors à personne de réel — d'où un 404 à l'ajout du nom.
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    const nom = (body.name ?? '').trim();
    if (!nom) throw new BadRequestException('Nom manquant');

    const project = await this.projectsService.createOrUpdate(user, {
      name: nom,
      description: '',
      keywords: [],
      extensions: body.extensions?.length ? body.extensions : ['.com', '.fr', '.net', '.org'],
      matchMode: 'any',
    });
    return project;
  }

  @Post(':id/suggestions')
  async addSuggestion(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AuthenticatedUser() keycloakUser: any,
    @Body() body: { domainName: string; availability: Record<string, boolean> },
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    return this.projectsService.addManualSuggestion(id, user, body.domainName, body.availability);
  }

  @Patch('suggestions/availability')
  async updateAvailability(
    @AuthenticatedUser() keycloakUser: any,
    @Body() body: { updates: { id: string; availability: Record<string, boolean> }[] },
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    await this.projectsService.updateSuggestionsAvailability(body.updates, user);
    return { ok: true };
  }

  @Patch('suggestions/:id/rating')
  async setRating(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AuthenticatedUser() keycloakUser: any,
    @Body('rating') rating: string,
  ) {
    if (!['liked', 'disliked', 'neutral'].includes(rating)) {
      throw new BadRequestException('rating must be liked, disliked or neutral');
    }
    const user = await this.usersService.findOrCreate(keycloakUser.sub, { email: keycloakUser.email, firstName: keycloakUser.given_name, lastName: keycloakUser.family_name });
    const result = await this.projectsService.setRating(id, user, rating as 'liked' | 'disliked' | 'neutral');
    return { rating: result };
  }
}