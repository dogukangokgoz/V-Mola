import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;

  connect(token: string, userId: number) {
    if (this.socket) {
      this.disconnect();
    }

    this.userId = userId;
    // Dinamik Socket URL
    const socketUrl = process.env.REACT_APP_API_URL 
      ? process.env.REACT_APP_API_URL.replace('/api', '')
      : `${window.location.protocol}//${window.location.hostname}:5000`;
    
    this.socket = io(socketUrl, {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Socket bağlandı');
      this.joinUserRoom(userId);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket bağlantısı kesildi');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket bağlantı hatası:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  private joinUserRoom(userId: number) {
    if (this.socket) {
      this.socket.emit('join_room', userId);
    }
  }

  joinDepartmentRoom(departmentId: string) {
    if (this.socket) {
      this.socket.emit('join_department', departmentId);
    }
  }

  // Event listeners
  onBreakStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('break_started', callback);
    }
  }

  onBreakEnded(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('break_ended', callback);
    }
  }

  // Event emitters
  emitBreakStarted(data: any) {
    if (this.socket) {
      this.socket.emit('break_started', data);
    }
  }

  emitBreakEnded(data: any) {
    if (this.socket) {
      this.socket.emit('break_ended', data);
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  removeListener(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  isConnected(): boolean {
    return this.socket ? this.socket.connected : false;
  }
}

export default new SocketService();

