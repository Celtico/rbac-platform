import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { ChatOpenAI } from '@langchain/openai';
import { z } from 'zod';
import { ChatCompletionDto } from './dto/chat-completion.dto';

@Injectable()
export class OpenAiService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async chatCompletion(dto: ChatCompletionDto) {
    try {
      const completion = await this.client.chat.completions.create({
        model: dto.model,
        messages: dto.messages,
        temperature: dto.temperature,
        max_tokens: dto.max_tokens,
      });
      return completion;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'OpenAI request failed';
      throw new InternalServerErrorException(message);
    }
  }

  async recommendAlbum(context: string) {
    try {
      const schema = z.object({
        title: z.string().describe('Suggested photo title (in Catalan)'),
        description: z
          .string()
          .describe('Short descriptive caption for the photo (in Catalan)'),
        imageQuery: z
          .string()
          .describe(
            'Short Unsplash search query to find a fitting image (in English)',
          ),
      });

      const model = new ChatOpenAI({
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY,
      }).withStructuredOutput(schema);

      return await model.invoke(
        `You are a creative photography advisor. Based on the following description, suggest a photo title, a short descriptive caption, and a short Unsplash image search query that visually fits the mood.\n\nDescription: ${context}`,
      );
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'OpenAI request failed';
      throw new InternalServerErrorException(message);
    }
  }

  async listModels() {
    try {
      const models = await this.client.models.list();
      return models.data.filter((m) => m.id.startsWith('gpt'));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'OpenAI request failed';
      throw new InternalServerErrorException(message);
    }
  }
}
