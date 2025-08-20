class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.onMessage = null;
    this.onConnectionChange = null;
  }

  connect() {
    try {
      this.socket = new WebSocket('ws://localhost:8087/ws/admin');
      
      this.socket.onopen = () => {
        console.log('Admin WebSocket connected');
        this.reconnectAttempts = 0;
        if (this.onConnectionChange) {
          this.onConnectionChange('connected');
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessage) {
            this.onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('Admin WebSocket disconnected');
        if (this.onConnectionChange) {
          this.onConnectionChange('disconnected');
        }
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.connect();
          }, this.reconnectInterval);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        if (this.onConnectionChange) {
          this.onConnectionChange('error');
        }
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      if (this.onConnectionChange) {
        this.onConnectionChange('error');
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}

export default WebSocketService;