import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignalrService } from './services/signalr.service';

declare var confetti: any;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public gameService = inject(SignalrService);
  
  constructor() {
    effect(() => {
      if (this.gameService.gameStatus() === 'Finished') {
        this.triggerWin();
      }
    });
  }

  triggerWin() {
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }
  
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
    return this.gameService.currentTurnPlayerName() === this.gameService.playerName();
  }
}
