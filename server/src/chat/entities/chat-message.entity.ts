import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  conversationId: number;

  @ManyToOne(() => ChatConversation, (conv) => conv.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: ChatConversation;

  @Column({ type: 'varchar' })
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  intent: string;

  @Column({ nullable: true, type: 'float' })
  confidence: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
