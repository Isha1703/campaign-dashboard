/**
 * Real-time streaming service using Server-Sent Events (SSE)
 * Handles connection management, reconnection, and message processing
 */

export interface StreamMessage {
  type: 'agent_output' | 'progress_update' | 'error' | 'status_change';
  session_id: string;
  timestamp: string;
  data: any;
}

export interface StreamConfig {
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export class RealTimeStreamService {
  private eventSource: EventSource | null = null;
  private config: StreamConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private listeners: Map<string, Set<(message: StreamMessage) => void>> = new Map();
  private sessionId: string | null = null;

  constructor(config: Partial<StreamConfig> = {}) {
    this.config = {
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      ...config
    };
  }

  /**
   * Connect to Server-Sent Events stream for a specific session
   */
  async connect(sessionId: string): Promise<void> {
    if (this.isConnecting || (this.eventSource && this.eventSource.readyState === EventSource.OPEN)) {
      return;
    }

    this.sessionId = sessionId;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // Import ApiService to create EventSource
        import('./api').then(({ ApiService }) => {
          console.log(`Connecting to SSE stream for session: ${sessionId}`);
          
          this.eventSource = ApiService.createEventSource(sessionId);

          this.eventSource.onopen = () => {
            console.log('SSE stream connected successfully');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            resolve();
          };

          this.eventSource.onmessage = (event) => {
            try {
              const message: StreamMessage = JSON.parse(event.data);
              this.handleMessage(message);
            } catch (error) {
              console.error('Failed to parse SSE message:', error);
              // Handle plain text messages as agent output
              const textMessage: StreamMessage = {
                type: 'agent_output',
                session_id: sessionId,
                timestamp: new Date().toISOString(),
                data: { output: event.data }
              };
              this.handleMessage(textMessage);
            }
          };

          this.eventSource.onerror = (error) => {
            console.error('SSE stream error:', error);
            this.isConnecting = false;
            
            if (this.eventSource?.readyState === EventSource.CLOSED) {
              this.scheduleReconnect();
            } else if (this.reconnectAttempts === 0) {
              // First connection attempt failed
              reject(new Error('SSE stream connection failed'));
            }
          };

        }).catch(error => {
          this.isConnecting = false;
          reject(error);
        });

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.sessionId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(messageType: string, callback: (message: StreamMessage) => void): () => void {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, new Set());
    }
    
    this.listeners.get(messageType)!.add(callback);

    // Return unsubscribe function
    return () => {
      const typeListeners = this.listeners.get(messageType);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(messageType);
        }
      }
    };
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    if (this.isConnecting) return 'connecting';
    if (this.eventSource) {
      switch (this.eventSource.readyState) {
        case EventSource.OPEN: return 'connected';
        case EventSource.CONNECTING: return 'connecting';
        case EventSource.CLOSED: return 'disconnected';
        default: return 'error';
      }
    }
    return 'disconnected';
  }

  /**
   * Handle incoming SSE messages
   */
  private handleMessage(message: StreamMessage): void {
    console.log('SSE message received:', message.type, message);

    // Notify type-specific listeners
    const typeListeners = this.listeners.get(message.type);
    if (typeListeners) {
      typeListeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in SSE message callback:', error);
        }
      });
    }

    // Notify all listeners
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(callback => {
        try {
          callback(message);
        } catch (error) {
          console.error('Error in SSE message callback:', error);
        }
      });
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max SSE reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts);
    console.log(`Scheduling SSE reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.sessionId) {
        this.connect(this.sessionId).catch(error => {
          console.error('SSE reconnection failed:', error);
        });
      }
    }, delay);
  }
}

// Singleton instance for global use
export const realTimeStreamService = new RealTimeStreamService();

export default RealTimeStreamService;