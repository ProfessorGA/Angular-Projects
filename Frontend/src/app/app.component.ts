import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalrService } from './services/signalr.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public gameService = inject(SignalrService);
  
  public playerName = '';
  public joinRoomCode = '';
  public secretNumber: number | null = null;
  public guessNumber: number | null = null;

  createRoom() {
    if (this.playerName.trim()) {
      this.gameService.createRoom(this.playerName);
    }
  }

  joinRoom() {
    if (this.playerName.trim() && this.joinRoomCode.trim()) {
      this.gameService.joinRoom(this.joinRoomCode.toUpperCase(), this.playerName);
    }
  }

  setSecret() {
    if (this.secretNumber && this.secretNumber >= 1 && this.secretNumber <= 100) {
      this.gameService.setSecretNumber(this.secretNumber);
    }
  }

  makeGuess() {
    if (this.guessNumber && this.guessNumber >= 1 && this.guessNumber <= 100) {
      this.gameService.makeGuess(this.guessNumber);
      this.guessNumber = null;
    }
  }

  get isMyTurn(): boolean {
    const me = this.gameService.player();
    const currentTurnId = this.gameService.currentTurnConnectionId();
    return me && currentTurnId === me.connectionId;
  }
}
