import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  private hubConnection: signalR.HubConnection | undefined;

  public roomCode = signal<string | null>(null);
  public player = signal<any>(null);
  public players = signal<any[]>([]);
  public gameStatus = signal<string>('Waiting'); // Waiting, ReadyToSetSecret, WaitingForOpponentSecret, Playing, Finished
  public error = signal<string | null>(null);
  public currentTurnConnectionId = signal<string | null>(null);
  public guesses = signal<any[]>([]);
  public winnerName = signal<string | null>(null);
  public opponentName = signal<string | null>(null);
  public isConnected = signal<boolean>(false);
  public gameRoom = signal<any>(null);

  constructor() {
    this.buildConnection();
  }

  private buildConnection() {
    const backendUrl = window.location.hostname === 'localhost' 
      ? 'https://localhost:7077/gamehub'
      : 'https://predict-and-win-61aw.onrender.com/gamehub'; 

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(backendUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('RoomCreated', (roomCode: string) => {
      console.log('Room Created:', roomCode);
      this.roomCode.set(roomCode);
      this.gameStatus.set('Waiting');
    });

    this.hubConnection.on('RoomJoined', (room: any) => {
      console.log('Room Joined Event:', room);
      this.gameRoom.set(room);
      this.roomCode.set(room.roomCode);
      if (room.players && room.players.length === 2) {
        this.gameStatus.set('ReadyToSetSecret');
      } else {
        this.gameStatus.set('Waiting');
      }
    });

    this.hubConnection.on('PlayerJoined', (player: any) => {
      if (!this.player()) {
        this.player.set(player);
      } else {
        this.opponentName.set(player.name);
      }
      this.players.update(p => {
        const exists = p.find(existing => existing.connectionId === player.connectionId);
        if (exists) return p;
        return [...p, player];
      });
    });

    this.hubConnection.on('GameReady', (players: any[]) => {
      this.players.set(players);
      this.gameStatus.set('ReadyToSetSecret');
      const me = this.player();
      const opp = players.find(p => p.connectionId !== me.connectionId);
      if(opp) this.opponentName.set(opp.name);
    });

    this.hubConnection.on('SecretNumberSet', (playerName: string) => {
      // Notification handled silently for now
    });

    this.hubConnection.on('GameStarted', (turnId: string) => {
      this.gameStatus.set('Playing');
      this.currentTurnConnectionId.set(turnId);
    });

    this.hubConnection.on('WrongGuess', (playerName: string, guess: number, nextTurnId: string) => {
      this.guesses.update(g => [{ playerName, guess, isCorrect: false }, ...g]);
      this.currentTurnConnectionId.set(nextTurnId);
    });

    this.hubConnection.on('GameOver', (playerName: string, winningGuess: number) => {
      this.guesses.update(g => [{ playerName, guess: winningGuess, isCorrect: true }, ...g]);
      this.winnerName.set(playerName);
      this.gameStatus.set('Finished');
    });

    this.hubConnection.on('Error', (msg: string) => {
      this.error.set(msg);
      setTimeout(() => this.error.set(null), 3000);
    });
  }

  public async startConnection() {
    if (this.hubConnection?.state === signalR.HubConnectionState.Disconnected) {
      try {
        await this.hubConnection.start();
        this.isConnected.set(true);
      } catch (err) {
        console.error('Error starting connection:', err);
        this.error.set('Failed to connect to game server');
      }
    }
  }

  public async createRoom(playerName: string) {
    await this.startConnection();
    await this.hubConnection?.invoke('CreateRoom', playerName);
  }

  public async joinRoom(roomCode: string, playerName: string) {
    try {
      await this.startConnection();
      const room = await this.hubConnection?.invoke('JoinRoom', roomCode, playerName);
      if (room) {
        this.gameRoom.set(room);
        this.roomCode.set(room.roomCode);
        if (room.players && room.players.length === 2) {
          this.gameStatus.set('ReadyToSetSecret');
        } else {
          this.gameStatus.set('Waiting');
        }
      }
    } catch (err) {
      console.error('Join Room Error:', err);
      this.error.set('Failed to join room. Check the code.');
    }
  }

  public async setSecretNumber(number: number) {
    await this.hubConnection?.invoke('SetSecretNumber', this.roomCode(), number);
    this.gameStatus.set('WaitingForOpponentSecret');
  }

  public async makeGuess(guess: number) {
    await this.hubConnection?.invoke('MakeGuess', this.roomCode(), guess);
  }
}
