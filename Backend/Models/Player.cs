namespace Backend.Models;

public class Player
{
    public int Id { get; set; }
    public string ConnectionId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int? SecretNumber { get; set; }
    public bool IsHost { get; set; }
}
