import { IsString, IsNotEmpty, IsOptional, IsArray, ArrayMaxSize, MinLength, MaxLength } from 'class-validator';

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
}
