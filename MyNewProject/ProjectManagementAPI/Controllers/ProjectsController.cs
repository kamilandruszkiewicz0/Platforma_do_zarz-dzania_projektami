using System.Security.Claims; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Json;

namespace ProjectManagementAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class ProjectsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProjectsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpOptions]
        public IActionResult Preflight()
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "*");
            Response.Headers.Add("Access-Control-Allow-Methods", "OPTIONS, GET, POST, PUT, DELETE");
            Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
            return Ok();
        }

        // GET: api/projects
        [HttpGet]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var currentUser = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(currentUser))
            {
                return Unauthorized(new { message = "User not logged in" });
            }

            var userProjects = await _context.Projects
                .Where(p => p.TeamMembers.Contains(currentUser))
                .ToListAsync();

            return Ok(userProjects);
        }
        
        // GET: api/projects/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProject(int id)
        {

            Response.Headers.Add("Access-Control-Allow-Origin", "*");
           
            var project = await _context.Projects
                .Include(p => p.TaskLists)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null) return NotFound();

            var response = new
            {
                project.Id,
                project.Name,
                project.Description,
                project.Status,
                project.Progress,
                Deadline = project.Deadline?.ToString("yyyy-MM-dd"),
                project.TeamMembers
            };

            return Ok(response);
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<TaskList>>> GetTaskListsByProject(int projectId)
        {
            
            Response.Headers.Add("Access-Control-Allow-Origin", "*");
           
            var taskLists = await _context.TaskLists
                .Where(tl => tl.ProjectId == projectId)
                .OrderBy(tl => tl.Order) // Sortowanie według `Order`
                .ToListAsync();

            return Ok(taskLists);
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateProject([FromBody] Project project)
        {
            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier); 
            Console.WriteLine($"[INFO] Creating project. Logged-in User ID: {currentUserId}");

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(new { message = "User not logged in" });
            }

            if (project.TeamMembers == null || !project.TeamMembers.Any())
            {
                project.TeamMembers = new List<string> { currentUserId };
            }

            try
            {
                _context.Projects.Add(project);
                await _context.SaveChangesAsync();

                var ownerRole = new UserProjectRole
                {
                    UserId = int.Parse(currentUserId),
                    ProjectId = project.Id,
                    Role = "Owner"
                };

                _context.UserProjectRoles.Add(ownerRole);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[INFO] Project created successfully. Project ID: {project.Id}");
                return CreatedAtAction(nameof(GetUserProjects), new { id = project.Id }, project);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Error creating project: {ex.Message}");
                return StatusCode(500, "Error creating project.");
            }
        }

        [HttpGet("my-projects")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<Project>>> GetUserProjects()
        {
            try
            {
                var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUsername = User.FindFirstValue(ClaimTypes.Name);

                if (string.IsNullOrEmpty(currentUserId) || string.IsNullOrEmpty(currentUsername))
                {
                    Console.WriteLine("[ERROR] Nieautoryzowany dostęp - brak danych użytkownika.");
                    return Unauthorized(new { message = "Token nieprawidłowy lub wygasł." });
                }

                var userProjects = await _context.Projects
                    .Where(p => p.TeamMembers.Contains(currentUsername))
                    .ToListAsync();

                return Ok(userProjects);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Błąd pobierania projektów: {ex.Message}");
                return StatusCode(500, new { message = "Wewnętrzny błąd serwera", error = ex.Message });
            }
        }

        [HttpPost("{projectId}/add-member")]
        [Authorize]
        public async Task<IActionResult> AddMemberToProject(int projectId, [FromBody] string username)
        {
            
            Response.Headers.Add("Access-Control-Allow-Origin", "*");
            
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(new { message = "User not logged in" });
            }

            var project = await _context.Projects.FindAsync(projectId);

            if (project == null)
            {
                return NotFound(new { message = "Project not found" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var ownerRole = await _context.UserProjectRoles
                .FirstOrDefaultAsync(r => r.UserId == int.Parse(currentUserId) && r.ProjectId == projectId && r.Role == "Owner");

            if (ownerRole == null)
            {
                return Forbid(new { message = "Only the project owner can add members." });
            }

            if (!project.TeamMembers.Contains(user.Id.ToString()))
            {
                project.TeamMembers.Add(user.Id.ToString());
            }

            _context.Projects.Update(project);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Member added successfully." });
        }

        private IActionResult Forbid(object value)
        {
            throw new NotImplementedException();
        }

        [HttpPut("{id}/rename")]
        [Authorize]
        public async Task<IActionResult> RenameProject(int id, [FromBody] JsonElement jsonData)
        {
            
            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(new { message = "User not logged in" });
            }

            if (!jsonData.TryGetProperty("newName", out var newNameElement))
            {
                return BadRequest(new { message = "Missing newName parameter" });
            }

            string newName = newNameElement.GetString();
            if (string.IsNullOrWhiteSpace(newName))
            {
                return BadRequest(new { message = "Project name cannot be empty" });
            }

            var project = await _context.Projects
                .Include(p => p.UserRoles)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound(new { message = "Project not found" });
            }

            var isOwner = project.UserRoles.Any(role => 
                role.UserId == int.Parse(currentUserId) && 
                role.Role == "Owner");

            if (!isOwner)
            {
                return Forbid(new { message = "You do not have permission to rename this project" });
            }

            project.Name = newName;
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Project renamed successfully", newName });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to rename project ID {id}: {ex.Message}");
                return StatusCode(500, new { message = "Error renaming project", error = ex.Message });
            }
        }

        // PUT: api/projects/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] Project updatedProject)
        {

            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            Console.WriteLine($"🛠 Aktualizacja projektu ID: {id}");

            var project = await _context.Projects.FindAsync(id);
            if (project == null)
            {
                Console.WriteLine($"❌ Projekt {id} nie istnieje!");
                return NotFound(new { message = "Project not found" });
            }

            Console.WriteLine($"📥 Otrzymane dane do aktualizacji: {JsonSerializer.Serialize(updatedProject)}");

            if (!string.IsNullOrWhiteSpace(updatedProject.Name))
            {
                Console.WriteLine($"✅ Aktualizacja nazwy: {updatedProject.Name}");
                project.Name = updatedProject.Name;
            }

            project.Status = updatedProject.Status;
            if (updatedProject.Deadline.HasValue)
            {
                project.Deadline = updatedProject.Deadline.Value.Date;
            }
            project.TeamMembers = updatedProject.TeamMembers ?? new List<string>();

            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine($"✅ Projekt ID {id} zaktualizowany w bazie!");

                return Ok(new { message = "Project updated successfully", project });
            }
            catch (DbUpdateConcurrencyException ex)
            {
                Console.WriteLine($"❌ Błąd zapisu do bazy: {ex.Message}");
                return StatusCode(500, new { message = "Database error", error = ex.Message });
            }
        }


        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProject(int id)
        {

            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(currentUserId))
            {
                return Unauthorized(new { message = "User not logged in" });
            }

            try
            {
                var project = await _context.Projects
                    .Include(p => p.UserRoles)
                    .FirstOrDefaultAsync(p => p.Id == id);

                if (project == null)
                {
                    return NotFound(new { message = "Project not found" });
                }

                var isOwner = project.UserRoles.Any(role => 
                    role.UserId == int.Parse(currentUserId) && 
                    role.Role == "Owner");

                if (!isOwner)
                {
                    return Forbid(new { message = "You do not have permission to delete this project" });
                }

                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[INFO] Project ID {id} deleted by User ID {currentUserId}");
                return NoContent();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to delete project ID {id}: {ex.Message}");
                return StatusCode(500, new { message = "An error occurred while deleting the project", error = ex.Message });
            }
        }

        [HttpGet("users")]
        public IActionResult GetUsers()
        {

            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var users = _context.Users.Select(u => new { u.Id, u.Username }).ToList();
            return Ok(users);
        }

        [HttpGet("{projectId}/users")]
        public IActionResult GetProjectUsers(int projectId)
        {

            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var project = _context.Projects
                .Where(p => p.Id == projectId)
                .Select(p => new
                {
                    Owners = _context.UserProjectRoles
                        .Where(upr => upr.ProjectId == p.Id && upr.Role == "Owner")
                        .Select(upr => new { upr.User.Id, upr.User.Username, upr.User.Email })
                        .ToList(),

                    Members = _context.Users
                        .Where(u => p.TeamMembers.Contains(u.Username))
                        .Select(u => new { u.Id, u.Username, u.Email })
                        .ToList()
                })
                .AsEnumerable()
                .FirstOrDefault();

            if (project == null)
            {
                return NotFound("Project not found.");
            }

            var users = project.Owners.Concat(project.Members).Distinct().ToList();

            return Ok(new { values = users });
        }

        [HttpGet("{projectId}/progress")]
        public async Task<IActionResult> GetProjectProgress(int projectId)
        {

            Response.Headers.Add("Access-Control-Allow-Origin", "*");

            var tasks = await _context.Tasks
                .Where(t => _context.TaskLists.Any(l => l.Id == t.TaskListId && l.ProjectId == projectId))
                .ToListAsync();

            if (!tasks.Any())
            {
                return Ok(new { progress = 0 });
            }

            int completedTasks = tasks.Count(t => t.IsCompleted);
            double progressPercentage = ((double)completedTasks / tasks.Count) * 100;

            return Ok(new { progress = Math.Round(progressPercentage, 2) });
        }

    }
}
