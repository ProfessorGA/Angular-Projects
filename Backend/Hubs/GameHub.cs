using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Backend.Hubs;

public class GameHub : Hub
{
    private readonly GameDbContext _context;

    public GameHub(GameDbContext context)
    {
        _context = context;
    }

    public async Task CreateRoom(string playerName)
    {
        string roomCode = Guid.NewGuid().ToString().Substring(0, 6).ToUpper();
        var player = new Player { ConnectionId = Context.ConnectionId, Name = playerName, IsHost = true };
        var room = new GameRoom { RoomCode = roomCode };
        room.Players.Add(player);

        _context.GameRooms.Add(room);
        await _context.SaveChangesAsync();

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Caller.SendAsync("RoomCreated", roomCode);
        await Clients.Group(roomCode).SendAsync("PlayerJoined", player);
    }

    public async Task JoinRoom(string roomCode, string playerName)
    {
        var room = await _context.GameRooms.Include(r => r.Players).FirstOrDefaultAsync(r => r.RoomCode == roomCode);
        if (room == null)
        {
            await Clients.Caller.SendAsync("Error", "Room not found");
            return;
        }

        if (room.Players.Count >= 2)
        {
            await Clients.Caller.SendAsync("Error", "Room is full");
            return;
        }

        var player = new Player { ConnectionId = Context.ConnectionId, Name = playerName, IsHost = false };
        room.Players.Add(player);
        await _context.SaveChangesAsync();

        await Groups.AddToGroupAsync(Context.ConnectionId, roomCode);
        await Clients.Group(roomCode).SendAsync("PlayerJoined", player);

        if (room.Players.Count == 2)
        {
            await Clients.Group(roomCode).SendAsync("GameReady", room.Players);
        }
    }

    public async Task SetSecretNumber(string roomCode, int secretNumber)
    {
        var room = await _context.GameRooms.Include(r => r.Players).FirstOrDefaultAsync(r => r.RoomCode == roomCode);
        if (room == null) return;

        var player = room.Players.FirstOrDefault(p => p.ConnectionId == Context.ConnectionId);
        if (player == null) return;

        player.SecretNumber = secretNumber;
        await _context.SaveChangesAsync();

        await Clients.Group(roomCode).SendAsync("SecretNumberSet", player.Name);

        if (room.Players.All(p => p.SecretNumber.HasValue))
        {
            room.Status = "Playing";
            var host = room.Players.First(p => p.IsHost);
            room.CurrentTurnConnectionId = host.ConnectionId;
            await _context.SaveChangesAsync();

            await Clients.Group(roomCode).SendAsync("GameStarted", host.ConnectionId);
        }
    }

    public async Task MakeGuess(string roomCode, int guessNumber)
    {
        var room = await _context.GameRooms
            .Include(r => r.Players)
            .Include(r => r.Guesses)
            .FirstOrDefaultAsync(r => r.RoomCode == roomCode);
            
        if (room == null || room.Status != "Playing") return;

        if (room.CurrentTurnConnectionId != Context.ConnectionId)
        {
            await Clients.Caller.SendAsync("Error", "Not your turn");
            return;
        }

        var currentPlayer = room.Players.First(p => p.ConnectionId == Context.ConnectionId);
        var opponent = room.Players.First(p => p.ConnectionId != Context.ConnectionId);

        bool isCorrect = opponent.SecretNumber == guessNumber;

        var guess = new Guess
        {
            PlayerConnectionId = Context.ConnectionId,
            GuessedNumber = guessNumber,
            IsCorrect = isCorrect,
            Timestamp = DateTime.UtcNow
        };
        room.Guesses.Add(guess);

        if (isCorrect)
        {
            room.Status = "Finished";
            room.WinnerConnectionId = Context.ConnectionId;
            await _context.SaveChangesAsync();
            await Clients.Group(roomCode).SendAsync("GameOver", currentPlayer.Name, guessNumber);
        }
        else
        {
            room.CurrentTurnConnectionId = opponent.ConnectionId;
            await _context.SaveChangesAsync();
            await Clients.Group(roomCode).SendAsync("WrongGuess", currentPlayer.Name, guessNumber, opponent.ConnectionId);
        }
    }
}
