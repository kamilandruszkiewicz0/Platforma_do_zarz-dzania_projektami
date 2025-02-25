using Microsoft.AspNetCore.Mvc;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System.Linq;
using System.Threading.Tasks;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace ProjectManagementAPI.Controllers
{
    [Route("auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            Console.WriteLine("🟢 `AuthController` został wywołany!");

            if (context == null)
            {
                Console.WriteLine("❌ ERROR: `AppDbContext` jest NULL!");
                throw new Exception("`AppDbContext` nie został poprawnie wstrzyknięty do `AuthController`.");
            }

            Console.WriteLine("✅ `AppDbContext` został poprawnie wstrzyknięty do `AuthController`.");
            _context = context;
            _configuration = configuration;
        }


        [HttpOptions("register")]
        [HttpOptions("login")]
        public IActionResult Preflight()
        {
            Console.WriteLine("Received OPTIONS request for CORS preflight.");
            Response.Headers.Add("Access-Control-Allow-Origin", "*");
            Response.Headers.Add("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, DELETE");
            Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return Ok();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            Console.WriteLine("🛠 Received Register request");

            if (user == null)
            {
                Console.WriteLine("❌ User payload is null");
                Response.Headers.Add("Access-Control-Allow-Origin", "*");
                return BadRequest(new { message = "Invalid request payload" });
            }

            try
            {
                Console.WriteLine($"🔍 Checking if user already exists: {user.Email}");
                var existingUser = _context.Users.FirstOrDefault(u => u.Email == user.Email);
                if (existingUser != null)
                {
                    Console.WriteLine("⚠️ User already exists");
                    Response.Headers.Add("Access-Control-Allow-Origin", "*");
                    return BadRequest(new { message = "User already exists" });
                }

                Console.WriteLine($"✅ Registering user: {user.Email}");
                user.Password = BCrypt.Net.BCrypt.HashPassword(user.Password);
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                Console.WriteLine("✅ User registered successfully");

                return Ok(new { message = "Registration successful" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Database error: {ex.Message}");
                return StatusCode(500, "Database error");
            }
        }
        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            Console.WriteLine("🛠 Received Login request");
            Console.WriteLine($"🔍 Payload: Email={request?.Email}, Password Provided={(string.IsNullOrEmpty(request?.Password) ? "No" : "Yes")}");

            if (request == null)
            {
                Console.WriteLine("❌ Login request payload is null.");
                return BadRequest(new { message = "Invalid request payload" });
            }

            var dbUser = _context.Users.FirstOrDefault(u => u.Email == request.Email);
            if (dbUser == null)
            {
                Console.WriteLine($"❌ User not found: {request.Email}");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, dbUser.Password))
            {
                Console.WriteLine("❌ Password verification failed.");
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var jwtKey = _configuration["Jwt:Secret"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                Console.WriteLine("❌ JWT secret is missing in configuration.");
                return StatusCode(500, new { message = "JWT secret is missing in configuration." });
            }

            Console.WriteLine("✅ Generating JWT token.");
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(jwtKey);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, dbUser.Username),
                    new Claim(ClaimTypes.NameIdentifier, dbUser.Id.ToString())
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            Console.WriteLine($"✅ User {dbUser.Username} logged in successfully. Token generated.");

            Response.Headers.Add("Access-Control-Allow-Origin", "*");
            return Ok(new { token = tokenString, username = dbUser.Username });
        }
    }
}
