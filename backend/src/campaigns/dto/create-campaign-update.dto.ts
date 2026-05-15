import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const MAX_UPDATE_IMAGES = 6;

export class CreateCampaignUpdateDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsString()
  @MinLength(1, { message: 'Update text is required.' })
  @MaxLength(8000)
  body!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_UPDATE_IMAGES)
  @IsString({ each: true })
  @MaxLength(2048, { each: true })
  imageUrls?: string[];
}
