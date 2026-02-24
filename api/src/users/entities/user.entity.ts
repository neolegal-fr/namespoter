import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  keycloakId: string;

  @Column({ nullable: true })
  email: string;

  /** Crédits issus de l'abonnement mensuel (remis à zéro à chaque renouvellement) */
  @Column({ default: 100 })
  credits: number;

  /** Crédits achetés en extra (permanents, jamais remis à zéro) */
  @Column({ default: 0 })
  extraCredits: number;

  /** ID client Stripe (créé lors du premier checkout) */
  @Column({ nullable: true })
  stripeCustomerId: string;

  /** ID abonnement Stripe actif */
  @Column({ nullable: true })
  stripeSubscriptionId: string;

  get totalCredits(): number {
    return this.credits + this.extraCredits;
  }
}
