using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class GameDbContext : DbContext
{
    public GameDbContext(DbContextOptions<GameDbContext> options) : base(options) { }

    public DbSet<GameRoom> GameRooms { get; set; }
    public DbSet<Player> Players { get; set; }
    public DbSet<Guess> Guesses { get; set; }
}
