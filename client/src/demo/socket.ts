import { answerChat } from "./chat";
import { getDb, scheduleSave } from "./runtime";
import { can, currentSession } from "./server";

/**
 * Substitut del socket del xat (`/chat` de Socket.io) per a la demo. Té la
 * part de la interfície de `Socket` que fa servir `GlobalChat`, i respon els
 * mateixos esdeveniments que `chat.gateway.ts`.
 */

type Listener = (payload: never) => void;

/** Retard de la resposta, perquè es vegi l'indicador d'"escrivint". */
const TYPING_MS = 550;

function sanitizeTitle(raw: string): string {
  return raw
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

export class DemoChatSocket {
  connected = false;
  private readonly listeners = new Map<string, Listener[]>();
  private closed = false;

  constructor() {
    // En un `setTimeout` perquè qui crea el socket tingui temps de subscriure's.
    void getDb().then(() =>
      setTimeout(() => {
        if (this.closed) return;
        this.connected = true;
        this.fire("connect", undefined);
      }, 0),
    );
  }

  on(event: string, listener: (payload: never) => void): this {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
    return this;
  }

  emit(event: string, payload?: unknown): this {
    if (event === "chat:send") void this.send(payload as { conversationId: number; message: string });
    return this;
  }

  disconnect(): this {
    this.closed = true;
    this.connected = false;
    this.listeners.clear();
    return this;
  }

  private fire(event: string, payload: unknown): void {
    for (const listener of this.listeners.get(event) ?? []) (listener as (p: unknown) => void)(payload);
  }

  private async send({ conversationId, message }: { conversationId: number; message: string }): Promise<void> {
    const db = await getDb();
    const session = currentSession(db);
    if (!session) {
      this.fire("chat:error", { message: "La sessió ha caducat. Torna a iniciar sessió." });
      return;
    }
    const { user } = session;
    if (!can(user, "use:chat")) {
      this.fire("chat:error", { message: "No tens permís per usar el xat. Contacta amb l'administrador per obtenir el permís use:chat." });
      return;
    }
    const conversation = db.get<{ id: number }>("SELECT id FROM chat_conversations WHERE id = ? AND userId = ?", [conversationId, user.id]);
    if (!conversation) {
      this.fire("chat:error", { message: "Conversa no trobada o accés denegat." });
      return;
    }

    const save = (role: "user" | "assistant", content: string, intent: string | null, confidence: number | null) => {
      const createdAt = new Date().toISOString();
      const id = db.insert("INSERT INTO chat_messages (conversationId, role, content, intent, confidence, createdAt) VALUES (?, ?, ?, ?, ?, ?)", [
        conversationId,
        role,
        content,
        intent,
        confidence,
        createdAt,
      ]);
      db.run("UPDATE chat_conversations SET updatedAt = ? WHERE id = ?", [createdAt, conversationId]);
      return { id, conversationId, role, content, createdAt };
    };

    const previous = Number(db.get<{ n: number }>("SELECT count(*) AS n FROM chat_messages WHERE conversationId = ? AND role = 'user'", [conversationId])?.n ?? 0);
    this.fire("chat:message", save("user", message, null, null));

    if (previous === 0) {
      const title = sanitizeTitle(message);
      db.run("UPDATE chat_conversations SET title = ? WHERE id = ?", [title, conversationId]);
      this.fire("chat:title_updated", { conversationId, title });
    }
    this.fire("chat:typing", { conversationId });

    await new Promise((resolve) => setTimeout(resolve, TYPING_MS));
    try {
      const result = answerChat(db, user, conversationId, message);
      this.fire("chat:message", { ...save("assistant", result.answer, result.intent, result.confidence), intent: result.intent, confidence: result.confidence });
    } catch (error) {
      console.error("[demo]", error);
      this.fire("chat:error", { message: "S'ha produït un error en processar la teva pregunta. Torna-ho a intentar." });
    }
    scheduleSave(db);
  }
}
