import { IsString, IsNotEmpty, IsOptional, IsObject, Matches, MaxLength } from 'class-validator';

export class TrackEventDto {
  /** Nom de l'événement, en snake_case (ex. « wizard_step_viewed »). */
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'Nom d\'événement invalide (snake_case attendu)' })
  name: string;

  /**
   * Identifiant de session anonyme, généré par le navigateur. Permet de
   * reconstituer un parcours sans identifier la personne.
   */
  @IsString()
  @IsOptional()
  @MaxLength(64)
  sessionId?: string;

  /** Contexte libre et borné : étape, durée, compteurs, message d'erreur… */
  @IsObject()
  @IsOptional()
  meta?: Record<string, unknown>;
}
