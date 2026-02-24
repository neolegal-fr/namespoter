import {
  Controller,
  Post,
  Get,
  Headers,
  Req,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import type { RawBodyRequest as RawBodyReq } from '@nestjs/common';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { PaymentsService } from './payments.service';
import { UsersService } from '../users/users.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
  ) {}

  /** Crée une session Checkout pour l'abonnement mensuel */
  @Post('checkout/subscription')
  async checkoutSubscription(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, keycloakUser.email);
    const url = await this.paymentsService.createSubscriptionCheckout(user);
    return { url };
  }

  /** Crée une session Checkout pour un pack de crédits ponctuel */
  @Post('checkout/pack')
  async checkoutPack(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, keycloakUser.email);
    const url = await this.paymentsService.createPackCheckout(user);
    return { url };
  }

  /** Crée une session Stripe Customer Portal */
  @Get('portal')
  async portal(@AuthenticatedUser() keycloakUser: any) {
    const user = await this.usersService.findOrCreate(keycloakUser.sub, keycloakUser.email);
    const url = await this.paymentsService.createPortalSession(user);
    return { url };
  }

  /** Webhook Stripe — corps brut requis pour la vérification de signature */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyReq<Request>,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Corps de la requête manquant');
    }

    try {
      await this.paymentsService.handleWebhook(req.rawBody, signature);
    } catch (err) {
      this.logger.error('Erreur webhook:', err);
      throw new BadRequestException('Webhook invalide');
    }

    return { received: true };
  }
}
