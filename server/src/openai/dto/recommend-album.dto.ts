import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RecommendAlbumDto {
  @ApiProperty({
    example: 'A melancholic indie folk album about rainy autumn evenings',
    description: 'Free-text description of the kind of album you want',
  })
  @IsString()
  context: string;
}
