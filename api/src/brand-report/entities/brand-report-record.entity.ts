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

  @CreateDateColumn()
  createdAt: Date;
}
