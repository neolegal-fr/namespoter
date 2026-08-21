import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { Project } from './project.entity';

export type SharePermission = 'read' | 'write';

/**
 * Accès donné à un projet par son propriétaire.
 *
 * La cible est une ADRESSE E-MAIL, pas un compte : on partage souvent avec
 * quelqu'un qui n'a pas encore de compte, et lui en demander un avant de lui
 * montrer quoi que ce soit reviendrait à lui faire payer d'avance une réponse
 * qu'on veut justement lui donner. Le compte Keycloak est provisionné au
 * moment de l'invitation ; le rapprochement se fait ensuite par l'e-mail,
 * qui est aussi l'identifiant de connexion du realm.
 *
 * Conséquence à connaître : changer l'adresse d'un compte lui fait perdre les
 * partages reçus. C'est le prix d'un partage qui fonctionne avant l'existence
 * du compte, et l'inverse — rattacher au `sub` Keycloak — ne le permettrait
 * pas du tout.
 */
@Entity()
@Index(['project', 'email'], { unique: true })
export class ProjectShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE', nullable: false })
  project: Project;

  /** Toujours en minuscules : une adresse ne se compare pas à la casse près. */
  @Index()
  @Column()
  email: string;

  @Column({ default: 'read' })
  permission: SharePermission;

  /** Mot d'accompagnement de l'invitation. Rien d'obligatoire. */
  @Column({ type: 'text', nullable: true })
  message: string | null;

  /** Qui a partagé — pour l'afficher, et pour savoir qui retirer l'accès. */
  @Column()
  invitedBySub: string;

  @CreateDateColumn()
  createdAt: Date;

  /**
   * Première ouverture effective du projet par l'invité.
   *
   * Sert à distinguer « invitation envoyée » de « invitation utilisée » : sans
   * cette date, une invitation partie dans les indésirables se lit comme un
   * partage actif.
   */
  @Column({ type: 'datetime', nullable: true })
  acceptedAt: Date | null;
}
