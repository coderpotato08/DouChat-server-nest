import { Transform } from 'class-transformer';
import { IsIn, IsMongoId, IsOptional, IsString } from 'class-validator';

export class OpenAiMessageRecordsDto {
  @IsMongoId()
  userId: string;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsString()
  fileName?: string;

  @IsOptional()
  @IsIn(['json', 'md'])
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  format?: 'json' | 'md';
}
