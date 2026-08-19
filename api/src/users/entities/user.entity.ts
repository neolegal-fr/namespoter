import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, OneToMany } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  keycloakId: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  /** Crédits gratuits mensuels (remis à 100 chaque mois via lazy reset) */
  @Column({ default: 100 })
  credits: number;

  /** Crédits achetés en pack (permanents, jamais remis à zéro) */
  @Column({ default: 0 })
  extraCredits: number;

  /** ID client Stripe (créé lors du premier checkout) */
  @Column({ nullable: true })
  stripeCustomerId: string;

  /** Locale préférée (ex: 'fr', 'en'), peuplée depuis le token Keycloak */
  @Column({ nullable: true })
  locale: string;

  /**
   * Porteur du rôle realm `admin`, recopié du token à chaque passage.
   *
   * Le rôle vit dans Keycloak, mais les statistiques se calculent en SQL : sans
   * cette colonne, il faudrait interroger Keycloak pour chaque agrégat. La
   * valeur se resynchronise à chaque appel authentifié, donc un retrait de rôle
   * se propage à la connexion suivante.
   */
  @Column({ default: false })
  isAdmin: boolean;

  /** Dernière date de reset des crédits gratuits (lazy reset mensuel) */
  @Column({ nullable: true, type: 'datetime' })
  lastFreeReset: Date | null;

  /**
   * Rapport approfondi offert : un par mois calendaire, indépendant du solde.
   *
   * `freeReportPeriod` est le mois de référence (« 2026-08») et
   * `freeReportUsedAt` l'horodatage de consommation. Le droit est disponible
   * quand la période courante diffère de `freeReportPeriod`, ou quand
   * `freeReportUsedAt` est nul : la bascule est CALCULÉE À LA LECTURE, comme
   * pour `lastFreeReset` — pas de tâche planifiée, donc pas de compte oublié.
   *
   * Non cumulable : un droit non utilisé est perdu à la fin du mois (décision
   * produit). Un rapport déjà payé reste consultable sans nouveau débit.
   */
  @Column({ nullable: true, type: 'varchar', length: 7 })
  freeReportPeriod: string | null;

  @Column({ nullable: true, type: 'datetime' })
  freeReportUsedAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @Column({ nullable: true, type: 'datetime' })
  lastLogin: Date | null;

  @OneToMany('Project', 'user')
  projects: Project[];

  get totalCredits(): number {
    return this.credits + this.extraCredits;
  }
}
