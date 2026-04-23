namespace Backend.Models;

public class GameRoom
{
    public int Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public List<Player> Players { get; set; } = new();
    public List<Guess> Guesses { get; set; } = new();
    public string Status { get; set; } = "Waiting"; // Waiting, Playing, Finished
    public string CurrentTurnConnectionId { get; set; } = string.Empty;
    public string WinnerConnectionId { get; set; } = string.Empty;
}
