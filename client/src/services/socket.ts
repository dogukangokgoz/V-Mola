import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userId: number | null = null;

  connect(token: string, userId: number) {
    // Socket bağlantısını geçici olarak devre dışı bırak
    console.log('Socket bağlantısı devre dışı bırakıldı');
    return;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  private joinUserRoom(userId: number) {
    // Devre dışı
  }

  joinDepartmentRoom(departmentId: string) {
    // Devre dışı
  }

  // Event listeners
  onBreakStarted(callback: (data: any) => void) {
    // Devre dışı
  }

  onBreakEnded(callback: (data: any) => void) {
    // Devre dışı
  }

  // Event emitters
  emitBreakStarted(data: any) {
    // Devre dışı
  }

  emitBreakEnded(data: any) {
    // Devre dışı
  }

  // Remove listeners
  removeAllListeners() {
    // Devre dışı
  }

  removeListener(event: string, callback?: (...args: any[]) => void) {
    // Devre dışı
  }

  isConnected(): boolean {
    return false;
  }
}

export default new SocketService();