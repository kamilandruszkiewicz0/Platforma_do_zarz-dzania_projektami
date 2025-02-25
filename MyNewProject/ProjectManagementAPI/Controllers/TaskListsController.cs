using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectManagementAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class TaskListsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TaskListsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/tasklists
        [HttpGet]
        public async Task<IActionResult> GetTaskLists([FromQuery] int projectId)
        {
            Console.WriteLine($"Fetching task lists for ProjectId: {projectId}");

            var taskLists = await _context.TaskLists
                .Where(tl => tl.ProjectId == projectId)
                .Include(tl => tl.Tasks)
                .ToListAsync();

            if (!taskLists.Any())
            {
                return NotFound(new { message = "No task lists found for the specified project." });
            }

            return Ok(taskLists);
        }

         [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<TaskList>>> GetTaskListsForProject(int projectId)
        {
            var taskLists = await _context.TaskLists
                .Where(tl => tl.ProjectId == projectId)
                .Include(tl => tl.Tasks)
                .ToListAsync();

            return taskLists;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskList>> GetTaskList(int id)
        {
            var taskList = await _context.TaskLists
                .Include(tl => tl.Tasks)
                .FirstOrDefaultAsync(tl => tl.Id == id);

            if (taskList == null)
            {
                return NotFound();
            }
            
            return taskList;
        }

        [HttpPost]
        public async Task<IActionResult> CreateTaskList([FromBody] TaskList taskList)
        {
            if (string.IsNullOrWhiteSpace(taskList.Name))
            {
                return BadRequest(new { message = "TaskList name is required." });
            }

            if (!_context.Projects.Any(p => p.Id == taskList.ProjectId))
            {
                return BadRequest(new { message = "Invalid ProjectId." });
            }

            _context.TaskLists.Add(taskList);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTaskListsForProject), new { projectId = taskList.ProjectId }, taskList);
        }

        // PUT: api/tasklists/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTaskList(int id, [FromBody] TaskList taskList)
        {
            if (id != taskList.Id)
            {
                return BadRequest(new { message = "TaskList ID mismatch" });
            }

            Console.WriteLine($"Updating TaskList: ID={taskList.Id}, Name={taskList.Name}, ProjectId={taskList.ProjectId}");

            _context.Entry(taskList).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                Console.WriteLine("Changes saved successfully.");
            }
            catch (DbUpdateConcurrencyException ex)
            {
                Console.WriteLine($"Concurrency error: {ex.Message}");
                if (!TaskListExists(id))
                {
                    return NotFound(new { message = "TaskList not found" });
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving changes: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error." });
            }

            return Ok(taskList);
        }

        private bool TaskListExists(int id)
        {
            return _context.TaskLists.Any(e => e.Id == id);
        }
    
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTaskList(int id)
        {
            var taskList = await _context.TaskLists
                .Include(tl => tl.Tasks)
                .FirstOrDefaultAsync(tl => tl.Id == id);

            if (taskList == null)
            {
                return NotFound();
            }

            _context.TaskLists.Remove(taskList);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderTaskLists([FromBody] ListReorderRequest request)
        {
            if (request.ListIds == null || !request.ListIds.Any())
            {
                return BadRequest("Invalid ListIds.");
            }

            var taskLists = await _context.TaskLists
                .Where(tl => request.ListIds.Contains(tl.Id))
                .ToListAsync();

            if (taskLists.Count != request.ListIds.Count)
            {
                return BadRequest("Some TaskLists not found.");
            }

            for (int i = 0; i < request.ListIds.Count; i++)
            {
                var list = taskLists.FirstOrDefault(tl => tl.Id == request.ListIds[i]);
                if (list != null)
                {
                    list.Order = i;
                }
            }

            await _context.SaveChangesAsync();
            return Ok("List order updated successfully.");
        }

        public class ListReorderRequest
        {
            public List<int> ListIds { get; set; }
        }
        
        [HttpPost("{id}/copy")]
        public async Task<IActionResult> CopyTaskList(int id)
        {
            var existingList = await _context.TaskLists
                .Include(tl => tl.Tasks)
                .FirstOrDefaultAsync(tl => tl.Id == id);

            if (existingList == null)
            {
                return NotFound(new { message = "TaskList not found" });
            }

            var newTaskList = new TaskList
            {
                Name = existingList.Name + " (Kopia)",
                ProjectId = existingList.ProjectId,
                Order = existingList.Order + 1 
            };

            _context.TaskLists.Add(newTaskList);
            await _context.SaveChangesAsync();

            foreach (var task in existingList.Tasks)
            {
                var newTask = new TaskItem
                {
                    Name = task.Name,
                    Description = task.Description,
                    TaskListId = newTaskList.Id,
                    AssignedTo = task.AssignedTo,
                    Order = task.Order
                };

                _context.Tasks.Add(newTask);
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTaskList), new { id = newTaskList.Id }, newTaskList);
        }

    }
}
