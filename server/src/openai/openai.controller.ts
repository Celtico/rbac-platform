import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Permissions } from '../auth/decorators/roles.decorator';
import { OpenAiService } from './openai.service';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import { RecommendAlbumDto } from './dto/recommend-album.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class OpenAiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Post('chat')
  @Permissions('use:ai')
  @ApiOperation({
    summary: 'Chat completion',
    description:
      'Proxies a chat completion request to OpenAI. Requires `use:ai` permission (admin only).',
  })
  @ApiResponse({ status: 200, description: 'OpenAI chat completion response' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – requires use:ai permission' })
  @ApiResponse({ status: 500, description: 'OpenAI API error' })
  chatCompletion(@Body() dto: ChatCompletionDto) {
    return this.openAiService.chatCompletion(dto);
  }

  @Post('recommend-album')
  @Permissions('use:ai')
  @ApiOperation({
    summary: 'AI album recommendation',
    description:
      'Given a free-text description, returns a suggested album title, artist and an Unsplash image search query. Requires `use:ai` permission (admin only).',
  })
  @ApiResponse({
    status: 200,
    description: 'Recommended title, artist and imageQuery',
    schema: {
      example: {
        title: 'Autumn Leaves',
        artist: 'The Melancholy Trio',
        imageQuery: 'rainy forest autumn fog',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – requires use:ai permission' })
  @ApiResponse({ status: 500, description: 'OpenAI API error' })
  recommendAlbum(@Body() dto: RecommendAlbumDto) {
    return this.openAiService.recommendAlbum(dto.context);
  }

  @Get('models')
  @Permissions('use:ai')
  @ApiOperation({
    summary: 'List available GPT models',
    description:
      'Returns GPT models available in the configured OpenAI account. Requires `use:ai` permission (admin only).',
  })
  @ApiResponse({ status: 200, description: 'List of GPT models' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – requires use:ai permission' })
  listModels() {
    return this.openAiService.listModels();
  }
}
