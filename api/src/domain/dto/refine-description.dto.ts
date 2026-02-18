import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RefineDescriptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'La description doit faire au moins 5 caractères' })
  @MaxLength(2000, { message: 'La description ne peut pas dépasser 2000 caractères' })
  description: string;
}
