import { Controller, Get, Param, Patch, Delete, Post, Logger, Body, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { AuthenticatedUser } from 'nest-keycloak-connect';
import { UsersService } from '../users/users.service';

@Controller('projects')
export class ProjectsController {
  private readonly logger = new Logger(ProjectsController.name);

  constructor(
    private readonly projectsService: ProjectsService,
    private readonly usersService: UsersService
  ) {}

  @Get()
  async findAll(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
    return this.projectsService.findAllByUser(user);
  }

  @Get(':id')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
    return this.projectsService.findOne(id, user);
  }

  @Patch(':id')
  async update(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any, @Body() data: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
    return this.projectsService.update(id, user, data);
  }

  @Delete(':id')
  async remove(@Param('id', new ParseUUIDPipe()) id: string, @AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
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
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
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
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
    return this.projectsService.addManualSuggestion(id, user, body.domainName, body.availability);
  }

  @Patch('suggestions/availability')
  async updateAvailability(
    @AuthenticatedUser() keycloakUser: any,
    @Body() body: { updates: { id: string; availability: Record<string, boolean> }[] },
  ) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
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
    const user = await this.usersService.findOrCreate(keycloakUser.sub);
    const result = await this.projectsService.setRating(id, user, rating as 'liked' | 'disliked' | 'neutral');
    return { rating: result };
  }
}