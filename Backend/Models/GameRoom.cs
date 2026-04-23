namespace Backend.Models;

public class GameRoom
{
    public int Id { get; set; }
    public string RoomCode { get; set; } = string.Empty;
    public List<Player> Players { get; set; } = new();
    public List<Guess> Guesses { get; set; } = new();
    public string Status { get; set; } = "Waiting"; // Waiting, SettingSecret1, SettingSecret2, Playing, Finished
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public string SettingSecretPlayerId { get; set; } = "";
    public string CurrentTurnPlayerName { get; set; } = string.Empty;
    public string WinnerPlayerName { get; set; } = string.Empty;
}
