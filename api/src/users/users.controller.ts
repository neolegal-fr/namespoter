import { Controller, Delete, Get, HttpCode, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService, isKeycloakAdmin } from './users.service';
import { AuthenticatedUser } from 'nest-keycloak-connect';
import { FunnelService, sessionIdDeLaRequete } from '../common/funnel/funnel.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly funnel: FunnelService,
  ) {}

  /**
   * Rattache la visite en cours au compte, et note l'inscription si c'en est une.
   *
   * Appelé depuis les deux points d'entrée que le front passe après une
   * connexion. Une création de compte n'a pas d'autre signal côté produit :
   * Keycloak ne prévient de rien, et `createdAt` ne distingue pas « créé par
   * cet appel » de « créé il y a une minute ».
   */
  private async rattacherVisite(req: Request, sub: string, cree: boolean): Promise<void> {
    const sid = sessionIdDeLaRequete(req);
    if (cree) await this.funnel.marquer(sid, 'compte', sub);
    else await this.funnel.lier(sid, sub);
  }

  @Get('me')
  async getMe(@AuthenticatedUser() keycloakUser: any, @Req() req: Request) {
    const { user, cree } = await this.usersService.findOrCreateDetaille(keycloakUser.sub, {
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      locale: keycloakUser.locale,
      isAdmin: isKeycloakAdmin(keycloakUser),
    });

    await this.rattacherVisite(req, keycloakUser.sub, cree);

    return {
      keycloakId: user.keycloakId,
      email: user.email,
      freeCredits: user.credits,
      packCredits: user.extraCredits,
      totalCredits: user.totalCredits,
    };
  }

  @Get('me/subscription')
  async getSubscription(@AuthenticatedUser() keycloakUser: any) {
    return this.usersService.getSubscription(keycloakUser.sub);
  }

  @Delete('me')
  @HttpCode(204)
  async deleteAccount(@AuthenticatedUser() keycloakUser: any) {
    await this.usersService.deleteAccount(keycloakUser.sub);
  }

  /**
   * Solde de crédits — et, en pratique, le premier appel authentifié de chaque
   * chargement de page : c'est lui qui rattache la visite au compte.
   */
  @Get('credits')
  async getCredits(@AuthenticatedUser() keycloakUser: any, @Req() req: Request) {
    const { user, cree } = await this.usersService.findOrCreateDetaille(keycloakUser.sub, {
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      locale: keycloakUser.locale,
      isAdmin: isKeycloakAdmin(keycloakUser),
    });
    await this.rattacherVisite(req, keycloakUser.sub, cree);
    return {
      credits: user.totalCredits,
      freeCredits: user.credits,
      packCredits: user.extraCredits,
    };
  }
}
