import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayMaxSize, MinLength, MaxLength, IsEmail } from 'class-validator';

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
}
