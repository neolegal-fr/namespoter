import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Project } from './project.entity';

@Entity()
export class DomainSuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  domainName: string; // Le nom sans extension

  @Column({ type: 'json' })
  availability: Record<string, boolean>;

  /**
   * Date du dernier contrôle de disponibilité des domaines.
   *
   * Les registres bougent : un nom libre hier peut être déposé aujourd'hui. La
   * carte annonce donc DEPUIS QUAND son verdict tient, au lieu de le présenter
   * comme intemporel. Distincte de la date du rapport de marque, qui ne couvre
   * ni les mêmes sources ni le même moment.
   *
   * Nullable : les suggestions antérieures à la colonne n'ont pas de date, et
   * inventer « aujourd'hui » leur donnerait une fraîcheur qu'elles n'ont pas.
   */
  @Column({ type: 'datetime', nullable: true })
  checkedAt: Date | null;

  @Column({ type: 'varchar', length: 10, default: 'neutral' })
  rating: 'liked' | 'disliked' | 'neutral';

  @Column({ nullable: true, type: 'text' })
  analysis: string | null;

  @Column({ nullable: true, default: 'standard' })
  style: string;

  @ManyToOne(() => Project, (project) => project.suggestions, { onDelete: 'CASCADE' })
  project: Project;
}
