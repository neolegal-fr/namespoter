import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { StripeEvent } from './entities/stripe-event.entity';

export type PackType = 'decouverte' | 'pro' | 'max';

const PACK_CREDITS: Record<PackType, number> = {
  decouverte: 500,
  pro: 2000,
  max: 5000,
};

const PACK_PRICE_ENV: Record<PackType, string> = {
  decouverte: 'STRIPE_PACK_DECOUVERTE_PRICE_ID',
  pro: 'STRIPE_PACK_PRO_PRICE_ID',
  max: 'STRIPE_PACK_MAX_PRICE_ID',
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(StripeEvent)
    private readonly stripeEventRepo: Repository<StripeEvent>,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2026-01-28.clover',
    });
  }

  private get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
  }

  /** Crée ou récupère le customer Stripe associé à l'utilisateur */
  private async ensureStripeCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { keycloakId: user.keycloakId },
    });

    await this.usersService.setStripeCustomerId(user.keycloakId, customer.id);
    return customer.id;
  }

  /** Crée une session Stripe Checkout pour un pack de crédits (decouverte | pro | max) */
  async createPackCheckout(user: User, packType: PackType): Promise<string> {
    const customerId = await this.ensureStripeCustomer(user);
    const priceId = this.configService.get<string>(PACK_PRICE_ENV[packType]);

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${this.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/payment/cancel`,
      metadata: { keycloakId: user.keycloakId, type: 'pack', packType },
      invoice_creation: { enabled: true },
    });

    return session.url!;
  }

  /** Vérifie si une session a déjà été traitée (idempotence) */
  private async isAlreadyProcessed(sessionId: string): Promise<boolean> {
    const existing = await this.stripeEventRepo.findOne({ where: { sessionId } });
    return !!existing;
  }

  /** Marque une session comme traitée */
  private async markProcessed(sessionId: string, type: string): Promise<void> {
    await this.stripeEventRepo.save({ sessionId, type });
  }

  /**
   * Traite une session Stripe Checkout après redirection vers /payment/success.
   * Fallback pour les environnements locaux où Stripe ne peut pas atteindre le webhook.
   * Idempotent : sans effet si la session a déjà été traitée par le webhook.
   */
  async fulfillSession(sessionId: string, keycloakId: string): Promise<{ creditsAdded: number }> {
    if (await this.isAlreadyProcessed(sessionId)) {
      this.logger.log(`Session déjà traitée : ${sessionId}`);
      return { creditsAdded: 0 };
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      return { creditsAdded: 0 };
    }

    if (session.metadata?.keycloakId !== keycloakId) {
      this.logger.warn(`Session ${sessionId} n'appartient pas à ${keycloakId}`);
      return { creditsAdded: 0 };
    }

    await this.markProcessed(sessionId, session.metadata?.type ?? 'unknown');

    if (session.mode === 'payment' && session.metadata?.type === 'pack') {
      const packType = (session.metadata?.packType ?? 'decouverte') as PackType;
      const credits = PACK_CREDITS[packType] ?? PACK_CREDITS.decouverte;
      await this.usersService.addExtraCredits(keycloakId, credits);
      this.logger.log(`fulfillSession: ${credits} crédits pack (${packType}) ajoutés pour ${keycloakId}`);
      return { creditsAdded: credits };
    }

    return { creditsAdded: 0 };
  }

  /** Traite un événement webhook Stripe (corps brut requis pour la vérification de signature) */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Signature webhook invalide:', err);
      throw new Error('Invalid webhook signature');
    }

    this.logger.log(`Webhook reçu: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const keycloakId = session.metadata?.keycloakId;
      if (!keycloakId) return;

      if (await this.isAlreadyProcessed(session.id)) {
        this.logger.log(`Webhook: session déjà traitée via fulfillSession: ${session.id}`);
        return;
      }
      await this.markProcessed(session.id, session.metadata?.type ?? 'unknown');

      if (session.mode === 'payment' && session.metadata?.type === 'pack') {
        const packType = (session.metadata?.packType ?? 'decouverte') as PackType;
        const credits = PACK_CREDITS[packType] ?? PACK_CREDITS.decouverte;
        await this.usersService.addExtraCredits(keycloakId, credits);
        this.logger.log(`Webhook: ${credits} crédits pack (${packType}) ajoutés pour ${keycloakId}`);
      }
    } else {
      this.logger.debug(`Événement non géré: ${event.type}`);
    }
  }
}
