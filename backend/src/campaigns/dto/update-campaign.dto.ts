import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { API_CAMPAIGN_TYPE_VALUES } from '../campaign-type.constants';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  goalAmount?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  recipientNote?: string;

  @IsOptional()
  @IsString()
  @IsIn([...API_CAMPAIGN_TYPE_VALUES])
  campaignType?: string;
}
