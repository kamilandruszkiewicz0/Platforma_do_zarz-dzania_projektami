using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;

[ApiController]
[Route("users")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

        [HttpOptions]
        [HttpOptions("change-username")]
        [HttpOptions("change-password")]

        public IActionResult Preflight()
        {
            Console.WriteLine("Received OPTIONS request for CORS preflight.");
            Response.Headers.Add("Access-Control-Allow-Origin", "*");
            Response.Headers.Add("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, DELETE");
            Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return Ok();
        }

    [HttpGet]
    public IActionResult GetUsers()
    {
        Response.Headers.Add("Access-Control-Allow-Origin", "*");
        
        var users = _context.Users.Select(u => new { u.Id, u.Username }).ToList();
        Console.WriteLine($"Users fetched: {users.Count} users found.");

        if (!users.Any())
        {
            return NotFound(new { message = "No users found" });
        }

        return Ok(users);
    }

    [HttpPost("change-username")]
    public async Task<IActionResult> ChangeUsername([FromBody] string newUsername)
    {
        Response.Headers.Add("Access-Control-Allow-Origin", "*");
   
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == null)
        {
            return Unauthorized(new { message = "User not logged in" });
        }

        var user = await _context.Users.FindAsync(int.Parse(currentUserId));
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var oldUsername = user.Username;

        user.Username = newUsername;

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {

            await _context.SaveChangesAsync();

            var affectedProjects = await _context.Projects
                .Where(p => p.TeamMembers.Contains(oldUsername))
                .ToListAsync();

            foreach (var project in affectedProjects)
            {
                project.TeamMembers = project.TeamMembers
                    .Select(tm => tm == oldUsername ? newUsername : tm)
                    .ToList();
            }

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "An error occurred while updating username.", error = ex.Message });
        }

        return Ok(new { message = "Username updated successfully" });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] string newPassword)
    {
        Response.Headers.Add("Access-Control-Allow-Origin", "*");

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (currentUserId == null)
        {
            return Unauthorized(new { message = "User not logged in" });
        }

        var user = await _context.Users.FindAsync(int.Parse(currentUserId));
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
        await _context.SaveChangesAsync();

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes("BardzoTajnyIWystarczajacoDlugiKluczJWT1234");

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return Ok(new { message = "Password updated successfully", token = tokenString });
    }

}
