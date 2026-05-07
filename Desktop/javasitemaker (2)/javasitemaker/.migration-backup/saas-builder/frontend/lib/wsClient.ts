import { Client, IFrame, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8080/ws';

type EventHandler = (event: SiteEvent) => void;

export interface SiteEvent {
  event: 'BLOCK_ADDED' | 'BLOCK_UPDATED' | 'BLOCK_DELETED' | 'BLOCKS_REORDERED' | 'STYLES_UPDATED' | 'SITE_PUBLISHED';
  block?: unknown;
  blockId?: string;
  blocks?: unknown[];
  globalStyles?: string;
  url?: string;
}

class WebSocketClient {
  private client: Client | null = null;
  private subscriptions: Map<string, () => void> = new Map();
  private connected = false;
  private connectCallbacks: Array<() => void> = [];

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL.replace('ws://', 'http://').replace('wss://', 'https://')),
        connectHeaders: {
          Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: (_frame: IFrame) => {
          this.connected = true;
          this.connectCallbacks.forEach((cb) => cb());
          this.connectCallbacks = [];
          resolve();
        },
        onStompError: (frame: IFrame) => {
          console.error('STOMP error:', frame.headers['message']);
          reject(new Error(frame.headers['message']));
        },
        onDisconnect: () => {
          this.connected = false;
          this.subscriptions.clear();
        },
      });

      this.client.activate();
    });
  }

  subscribeSite(siteId: string, handler: EventHandler): () => void {
    const topic = `/topic/site/${siteId}`;

    const subscribe = () => {
      if (!this.client || !this.connected) return;

      const sub = this.client.subscribe(topic, (message: IMessage) => {
        try {
          const event: SiteEvent = JSON.parse(message.body);
          handler(event);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      });

      this.subscriptions.set(siteId, () => sub.unsubscribe());
    };

    if (this.connected) {
      subscribe();
    } else {
      this.connectCallbacks.push(subscribe);
      this.connect().catch(console.error);
    }

    return () => {
      const unsubscribe = this.subscriptions.get(siteId);
      if (unsubscribe) {
        unsubscribe();
        this.subscriptions.delete(siteId);
      }
    };
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connected = false;
    }
  }
}

export const wsClient = new WebSocketClient();
