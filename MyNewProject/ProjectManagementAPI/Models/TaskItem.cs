using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementAPI.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsCompleted { get; set; }
        public int TaskListId { get; set; } 
        public string AssignedTo { get; set; } = string.Empty;

        public int Order { get; set; } 
        [Column(TypeName = "timestamp with time zone")]
        public DateTime? Deadline { get; set; }
    }
}
