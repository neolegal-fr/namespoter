import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayMaxSize, MinLength, MaxLength, IsEmail, IsBoolean, IsUUID } from 'class-validator';

export class BrandReportRequestDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères' })
  @MaxLength(60, { message: 'Le nom ne peut pas dépasser 60 caractères' })
  name: string;

  /** Extensions de domaine à vérifier. Défaut appliqué côté service si absent. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  extensions?: string[];

  /** Destinataires de l'envoi du rapport (le compte + éventuels ajouts). Défaut : email du compte. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsEmail({}, { each: true, message: 'Adresse email invalide' })
  emails?: string[];

  /**
   * Projet d'où part la demande, s'il y en a un.
   *
   * Sa seule raison d'être : un projet PARTAGÉ en écriture se paie sur la
   * réserve de son propriétaire. Sans cet identifiant, le serveur ne peut pas
   * savoir pour le compte de qui le collaborateur agit, et débiterait le
   * mauvais compte.
   */
  @IsOptional()
  @IsUUID()
  projectId?: string;

  /** Forcer une régénération (ignore le cache et redébite). */
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  /**
   * Le projet et son public, tels que saisis dans le wizard.
   *
   * Bornés à la lecture : une description de projet est du texte libre venu du
   * navigateur, et elle finit dans un email. `@IsOptional` sans validation
   * fine suffit ici — le rendu échappe systématiquement (voir `esc()`).
   */
  @IsOptional()
  context?: { description?: string; audience?: { label: string; value: string }[] };
}
