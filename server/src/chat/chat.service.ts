import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatConversation)
    private readonly convRepo: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private readonly msgRepo: Repository<ChatMessage>,
  ) {}

  async createConversation(userId: number): Promise<ChatConversation> {
    const conv = this.convRepo.create({ userId, title: 'Nova conversa' });
    return this.convRepo.save(conv);
  }

  async getUserConversations(userId: number): Promise<ChatConversation[]> {
    return this.convRepo.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
      select: ['id', 'title', 'createdAt', 'updatedAt', 'userId'],
    });
  }

  async getConversation(id: number, userId: number): Promise<ChatConversation> {
    const conv = await this.convRepo.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { createdAt: 'ASC' } } as any,
    });
    if (!conv) throw new NotFoundException(`Conversation #${id} not found`);
    if (conv.userId !== userId) throw new ForbiddenException();
    return conv;
  }

  async saveMessage(
    conversationId: number,
    role: 'user' | 'assistant',
    content: string,
    intent?: string,
    confidence?: number,
  ): Promise<ChatMessage> {
    const msg = this.msgRepo.create({ conversationId, role, content, intent, confidence });
    const saved = await this.msgRepo.save(msg);
    // Update conversation updatedAt
    await this.convRepo.update(conversationId, { updatedAt: new Date() });
    return saved;
  }

  async updateTitle(conversationId: number, title: string): Promise<void> {
    await this.convRepo.update(conversationId, { title });
  }

  async deleteConversation(id: number, userId: number): Promise<void> {
    const conv = await this.convRepo.findOne({ where: { id } });
    if (!conv) throw new NotFoundException(`Conversation #${id} not found`);
    if (conv.userId !== userId) throw new ForbiddenException();
    await this.convRepo.remove(conv);
  }
}
