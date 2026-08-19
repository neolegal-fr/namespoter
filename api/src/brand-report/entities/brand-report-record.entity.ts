import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { BrandReport } from '../dto/brand-report.types';

/**
 * Rapport déjà généré, mémorisé par (utilisateur, nom) : permet de le
 * reproposer sans redébiter 500 crédits (cf. demande produit du 06/08/2026).
 */
@Entity()
@Index(['keycloakId', 'nameKey'], { unique: true })
export class BrandReportRecord {
  @PrimaryGeneratedColumn()
  id: number;

  /** Propriétaire (sub Keycloak). */
  @Column()
  keycloakId: string;

  /** Clé de recherche : nom normalisé (minuscules, sans espaces superflus). */
  @Column()
  nameKey: string;

  /** Nom d'origine tel que saisi. */
  @Column()
  name: string;

  /** Rapport complet sérialisé. */
  @Column({ type: 'json' })
  report: BrandReport;

  /** Jeton de partage public (lecture seule via /brand-report/shared/:token). */
  @Column({ nullable: true })
  @Index({ unique: true })
  shareToken: string;

  /**
   * Crédits RÉELLEMENT débités pour ce rapport : 0 s'il a consommé le rapport
   * offert du mois, sinon le tarif en vigueur au moment de l'achat. Stocké sur
   * l'enregistrement, pas déduit du tarif courant : un changement de prix ne
   * doit pas réécrire l'historique. Nullable pour les rapports antérieurs à
   * cette colonne, dont le coût n'a pas été conservé.
   */
  @Column({ type: 'int', nullable: true })
  costCredits: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
