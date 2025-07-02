import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ModelResponse, ProcessingStatus, QuestionRequest } from '../models/model.interfaces';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private messageSubject = new Subject<ModelResponse | ProcessingStatus>();
  private connectionSubject = new BehaviorSubject<boolean>(false);
  private currentSessionId: string | null = null;

  constructor() {}

  connect(): Observable<boolean> {
    return new Observable(observer => {
      const wsUrl = 'ws://localhost:8000/ws';
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.connectionSubject.next(true);
        observer.next(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Ignore messages from previous sessions
          if (data.sessionId && data.sessionId !== this.currentSessionId) {
            console.log('Ignoring message from previous session:', data.sessionId);
            return;
          }
          
          this.messageSubject.next(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionSubject.next(false);
        observer.error(error);
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
        this.connectionSubject.next(false);
        
        if (event.code !== 1000 && event.code !== 1001) {
          observer.error(new Error('Connection lost unexpectedly'));
        }
      };
    });
  }

  sendQuestion(request: QuestionRequest): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.currentSessionId = request.sessionId;
      this.socket.send(JSON.stringify(request));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  getMessages(): Observable<ModelResponse | ProcessingStatus> {
    return this.messageSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionSubject.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      this.currentSessionId = null;
      this.socket.close(1000, 'User disconnected');
      this.socket = null;
    }
  }

  stopProcessing(): void {
    this.currentSessionId = null;
    if (this.socket) {
      this.socket.close(1000, 'Processing stopped by user');
      this.socket = null;
    }
  }

  generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}