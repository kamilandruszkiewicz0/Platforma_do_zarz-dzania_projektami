using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Data;
using ProjectManagementAPI.Models;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectManagementAPI.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskItem>> GetTask(int id)
        {
            var taskItem = await _context.Tasks
                .Include(t => t.TaskListId)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (taskItem == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                taskItem.Id,
                taskItem.Name,
                taskItem.Description,
                taskItem.AssignedTo
            });
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskItem taskItem)
        {
            if (taskItem == null || string.IsNullOrWhiteSpace(taskItem.Name))
            {
                return BadRequest(new { message = "Task name is required." });
            }

            if (!_context.TaskLists.Any(tl => tl.Id == taskItem.TaskListId))
            {
                return BadRequest(new { message = $"Invalid TaskListId: {taskItem.TaskListId}" });
            }

            if (taskItem.Deadline.HasValue)
            {
                taskItem.Deadline = DateTime.SpecifyKind(taskItem.Deadline.Value, DateTimeKind.Utc);
            }

            _context.Tasks.Add(taskItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTask), new { id = taskItem.Id }, taskItem);
        }

        private bool TaskExists(int id)
        {
            return _context.Tasks.Any(e => e.Id == id);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem updatedTask)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            task.Name = updatedTask.Name;
            task.Description = updatedTask.Description;
            task.AssignedTo = updatedTask.AssignedTo;
            
            if (updatedTask.Deadline.HasValue)
            {
                task.Deadline = DateTime.SpecifyKind(updatedTask.Deadline.Value, DateTimeKind.Utc);
            }

            await _context.SaveChangesAsync();
            return Ok(task);
        }

        [HttpPut("{id}/description")] 
        public async Task<IActionResult> UpdateTaskDescription(int id, [FromBody] string newDescription)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound();
            }

            task.Description = newDescription;
            _context.Entry(task).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(task);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal Server Error: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("reorder")]
        public async Task<IActionResult> ReorderTasks([FromBody] TaskReorderRequest request)
        {
            if (request.TaskIds == null || !request.TaskIds.Any())
            {
                return BadRequest("Invalid TaskIds");
            }

            var taskList = await _context.TaskLists
                .Include(tl => tl.Tasks)
                .FirstOrDefaultAsync(tl => tl.Id == request.TaskListId);

            if (taskList == null)
            {
                return NotFound("TaskList not found.");
            }

            for (int i = 0; i < request.TaskIds.Count; i++)
            {
                var task = taskList.Tasks.FirstOrDefault(t => t.Id == request.TaskIds[i]);
                if (task != null)
                {
                    task.Order = i;
                }
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok("Task order updated successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error saving task order: {ex.Message}");
                return StatusCode(500, "An error occurred while updating task order.");
            }
        }

        public class TaskReorderRequest
        {
            public int TaskListId { get; set; }
            public List<int> TaskIds { get; set; }
        }

        [HttpPut("move")]
        public async Task<IActionResult> MoveTask([FromBody] TaskMoveRequest request)
        {
            if (request == null || request.TaskId <= 0 || request.DestinationListId <= 0)
            {
                return BadRequest("Invalid request payload.");
            }

            var task = await _context.Tasks.FindAsync(request.TaskId);
            if (task == null)
            {
                return NotFound("Task not found.");
            }

            var destinationList = await _context.TaskLists
                .FirstOrDefaultAsync(tl => tl.Id == request.DestinationListId);

            if (destinationList == null)
            {
                return NotFound("Destination task list not found.");
            }

            task.TaskListId = request.DestinationListId;
            task.Order = request.NewOrder;

            await _context.SaveChangesAsync();
            return Ok("Task moved successfully.");
        }

        public class TaskMoveRequest
        {
            public int TaskId { get; set; }
            public int DestinationListId { get; set; }
            public int NewOrder { get; set; }
        }

        [HttpPut("{id}/toggle-completion")]
        public async Task<IActionResult> ToggleTaskCompletion(int id)
        {
            Console.WriteLine($"Received request to toggle task {id}");
            var task = await _context.Tasks.FindAsync(id);
            
            if (task == null)
            {
                Console.WriteLine("Task not found!");
                return NotFound();
            }

            task.IsCompleted = !task.IsCompleted;
            await _context.SaveChangesAsync();
            Console.WriteLine($"Task {id} completion status changed to {task.IsCompleted}");

            return Ok(task);
        }

        public class TaskCompletionUpdateDto
        {
            public bool IsCompleted { get; set; }
        }

    }
}
