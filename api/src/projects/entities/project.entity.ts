import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { DomainSuggestion } from './domain-suggestion.entity';

@Entity()
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column('simple-array')
  keywords: string[];

  @Column('simple-array')
  extensions: string[];

  @Column({ default: 'any' })
  matchMode: string;

  /** Longueur minimale des noms générés (réglage de l'écran de configuration). */
  @Column({ type: 'int', default: 7 })
  minLength: number;

  /** Exemples de noms/domaines aimés, servant de références de style. */
  @Column('simple-array', { default: '' })
  likedExamples: string[];

  /** Exemples de noms/domaines dont le style est rejeté. */
  @Column('simple-array', { default: '' })
  dislikedExamples: string[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => DomainSuggestion, (suggestion) => suggestion.project, { cascade: true })
  suggestions: DomainSuggestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
