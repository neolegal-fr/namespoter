import { Entity, Column, PrimaryColumn, Index } from 'typeorm';

/**
 * Un compte, un jour où il s'est servi du produit.
 *
 * `user.lastLogin` ne retient que la DERNIÈRE fois : un compte actif deux
 * semaines de suite n'apparaît que dans la seconde. La mesure est donc juste
 * pour une fenêtre qui se termine maintenant, et fausse pour toute autre —
 * période précédente comprise, celle-là même à laquelle on veut se comparer.
 *
 * Une ligne par (compte, jour), écrite au premier appel authentifié de la
 * journée. Pas de colonne de plus : la présence de la ligne EST l'information,
 * et un compteur d'appels mesurerait le bavardage du navigateur, pas l'usage.
 */
@Entity('user_activity_day')
export class UserActivityDay {
  @PrimaryColumn({ type: 'int' })
  userId: number;

  /**
   * Jour civil (pas d'horodatage) : deux appels du même compte le même jour
   * sont un seul jour d'activité. Type `date` — un `datetime` obligerait
   * chaque agrégat à tronquer, et laisserait passer des doublons.
   */
  @PrimaryColumn({ type: 'date' })
  @Index()
  day: string;
}
