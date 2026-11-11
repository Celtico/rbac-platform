import { io } from "socket.io-client";
import { IS_DEMO } from "../config";

/** La part del socket del xat que fa servir la pàgina `GlobalChat`. */
export interface ChatSocket {
  connected: boolean;
  on(event: string, listener: (payload: never) => void): unknown;
  emit(event: string, payload?: unknown): unknown;
  disconnect(): unknown;
}

/**
 * Socket de la demo. El codi de la demo es carrega a part (no entra al bundle
 * de l'app amb servidor), i mentre arriba es guarden les crides per repetir-les.
 */
class LazyDemoSocket implements ChatSocket {
  connected = false;
  private readonly inner = import("../demo/socket").then((m) => new m.DemoChatSocket());

  on(event: string, listener: (payload: never) => void): this {
    void this.inner.then((socket) => socket.on(event, listener));
    return this;
  }

  emit(event: string, payload?: unknown): this {
    void this.inner.then((socket) => socket.emit(event, payload));
    return this;
  }

  disconnect(): this {
    void this.inner.then((socket) => socket.disconnect());
    return this;
  }
}

/** Obre el socket del xat: Socket.io contra el backend, o el simulat a la demo. */
export function createChatSocket(): ChatSocket {
  if (IS_DEMO) return new LazyDemoSocket();
  // Auth travels via the HttpOnly cookie sent with the handshake; the gateway
  // reads it server-side (no token in JS).
  return io("/chat", { withCredentials: true, path: "/socket.io" });
}
