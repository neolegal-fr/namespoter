import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';
import {
  DESCRIPTION_MIN_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_MESSAGE,
  DESCRIPTION_MAX_MESSAGE,
} from './description.constants';

export class RefineDescriptionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(DESCRIPTION_MIN_LENGTH, { message: DESCRIPTION_MIN_MESSAGE })
  @MaxLength(DESCRIPTION_MAX_LENGTH, { message: DESCRIPTION_MAX_MESSAGE })
  description: string;

  @IsOptional()
  @IsIn(['cs','da','de','en','es','fi','fr','hu','it','ja','nl','no','pl','pt','ro','ru','sv','tr','zh'])
  locale?: string; // ex: 'fr', 'de', 'es' — null/absent = international
}
