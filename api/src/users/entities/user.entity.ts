import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  keycloakId: string;

  @Column({ nullable: true })
  email: string;

  /** Crédits gratuits mensuels (remis à 100 chaque mois via lazy reset) */
  @Column({ default: 100 })
  credits: number;

  /** Crédits achetés en pack (permanents, jamais remis à zéro) */
  @Column({ default: 0 })
  extraCredits: number;

  /** ID client Stripe (créé lors du premier checkout) */
  @Column({ nullable: true })
  stripeCustomerId: string;

  /** Dernière date de reset des crédits gratuits (lazy reset mensuel) */
  @Column({ nullable: true, type: 'datetime' })
  lastFreeReset: Date | null;

  get totalCredits(): number {
    return this.credits + this.extraCredits;
  }
}
