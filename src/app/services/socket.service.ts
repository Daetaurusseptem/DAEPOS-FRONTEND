import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | undefined;

  constructor() {}

  public connect(userData?: { userId: string, companyId: string, branchId?: string, role?: string }, fallbackBranchId?: string): void {
    if (!this.socket) {
      // Usar la misma URL que apiUrl pero sin el sufijo /api
      const serverUrl = environment.apiUrl.replace('/api', '');
      this.socket = io(serverUrl);
      
      this.socket.on('connect', () => {
        console.log('WS Connectado al servidor');
        
        // Backward compatibility and specific branch joining
        if (fallbackBranchId) {
          this.socket!.emit('join-branch-room', fallbackBranchId);
        }
        
        // Join global user notification rooms
        if (userData) {
          this.socket!.emit('join-user-rooms', userData);
        }
      });
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
  }

  public onEvent<T>(eventName: string): Observable<T> {
    return new Observable<T>(observer => {
      if (!this.socket) return;
      this.socket.on(eventName, (data: T) => {
        observer.next(data);
      });
      return () => {
        if (this.socket) {
          this.socket.off(eventName);
        }
      };
    });
  }
}
