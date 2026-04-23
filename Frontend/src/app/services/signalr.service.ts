import { Injectable, signal, computed } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {
  public hubConnection: signalR.HubConnection | undefined;

  public roomCode = signal<string | null>(null);
  public playerName = signal<string | null>(null);
  public gameStatus = signal<string>('Landing'); 
  public error = signal<string | null>(null);
  public currentTurnPlayerName = signal<string | null>(null);
  public guesses = signal<any[]>([]);
  public winnerName = signal<string | null>(null);
  public isConnected = signal<boolean>(false);
  public gameRoom = signal<any>(null);

  public player = computed(() => 
    this.gameRoom()?.players?.find((p: any) => p.name === this.playerName())
  );

  public opponentName = computed(() => 
    this.gameRoom()?.players?.find((p: any) => p.name !== this.playerName())?.name
  );

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
      this.roomCode.set(roomCode);
      this.gameStatus.set('Waiting');
    });

    this.hubConnection.on('RoomJoined', (room: any) => {
      this.gameRoom.set(room);
      this.roomCode.set(room.roomCode);
      this.gameStatus.set(room.status);
    });

    this.hubConnection.on('GameStarted', (turnPlayerName: string) => {
      this.gameStatus.set('Playing');
      this.currentTurnPlayerName.set(turnPlayerName);
    });

    this.hubConnection.on('WrongGuess', (playerName: string, guess: number, nextTurnPlayerName: string, hint: string) => {
      this.guesses.update(g => [{ playerName, guess, isCorrect: false, hint }, ...g]);
      this.currentTurnPlayerName.set(nextTurnPlayerName);
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
    this.playerName.set(playerName);
    await this.startConnection();
    await this.hubConnection?.invoke('CreateRoom', playerName);
  }

  public async joinRoom(roomCode: string, playerName: string) {
    this.playerName.set(playerName);
    try {
      await this.startConnection();
      const room = await this.hubConnection?.invoke('JoinRoom', roomCode, playerName);
      if (room) {
        this.gameRoom.set(room);
        this.roomCode.set(room.roomCode);
        this.gameStatus.set(room.status);
      }
    } catch (err) {
      console.error('Join Room Error:', err);
      this.error.set('Failed to join room. Check the code.');
    }
  }

  public async setSecretNumber(number: number) {
    await this.hubConnection?.invoke('SetSecretNumber', this.roomCode(), number);
  }

  public async makeGuess(guess: number) {
    await this.hubConnection?.invoke('MakeGuess', this.roomCode(), guess);
  }
}
