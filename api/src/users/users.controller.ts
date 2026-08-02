import { Controller, Delete, Get, HttpCode } from '@nestjs/common';
import { UsersService, isKeycloakAdmin } from './users.service';
import { AuthenticatedUser } from 'nest-keycloak-connect';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, {
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      locale: keycloakUser.locale,
      isAdmin: isKeycloakAdmin(keycloakUser),
    });
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

  @Get('credits')
  async getCredits(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, {
      email: keycloakUser.email,
      firstName: keycloakUser.given_name,
      lastName: keycloakUser.family_name,
      locale: keycloakUser.locale,
      isAdmin: isKeycloakAdmin(keycloakUser),
    });
    return {
      credits: user.totalCredits,
      freeCredits: user.credits,
      packCredits: user.extraCredits,
    };
  }
}
