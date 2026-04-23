namespace Backend.Models;

public class Guess
{
    public int Id { get; set; }
    public string PlayerConnectionId { get; set; } = string.Empty;
    public int GuessedNumber { get; set; }
    public bool IsCorrect { get; set; }
    public DateTime Timestamp { get; set; }
}
