import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  public connection: any = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5274/chathub')
    .configureLogging(signalR.LogLevel.Information)
    .build();

  public messages$ = new BehaviorSubject<any>([]);
  public connectedUsers$ = new BehaviorSubject<any>([]);
  public messages: any[] = [];
  public users: string[] = [];

  constructor() {
    this.start();
    this.connection.on(
      'ReceiveMessage:',
      (user: string, message: string, messageTime: string) => {
        this.messages = [...this.messages, { user, message, messageTime }];
        this.messages$.next(this.messages);
      }
    );
    this.connection.on('ConnectedUser', (users: any) => {
      this.connectedUsers$.next(users);
    });
  }

  public async start() {
    try {
      await this.connection.start();
      console.log('started');
    } catch (err) {
      console.log(err);
    }
  }
  public async joinRoom(user: string, room: string) {
    return this.connection.invoke('JoinRoom', { user, room });
  }
  public async sendMessage(message: string) {
    return this.connection.invoke('SendMessage', message);
  }
  public async leaveChat() {
    return this.connection.stop();
  }
}
