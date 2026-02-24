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

  @Column({ default: false })
  isFavorite: boolean;

  @Column({ nullable: true, type: 'text' })
  analysis: string | null;

  @ManyToOne(() => Project, (project) => project.suggestions)
  project: Project;
}
