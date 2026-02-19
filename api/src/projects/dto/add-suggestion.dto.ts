import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class AddSuggestionDto {
  @IsString()
  @IsNotEmpty()
  domainName: string;

  @IsObject()
  availability: Record<string, boolean>;
}
