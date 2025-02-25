using System.ComponentModel.DataAnnotations.Schema;

namespace ProjectManagementAPI.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } = "W trakcie";
        public int Progress { get; set; } = 0;
        
        [Column(TypeName = "timestamp without time zone")]
        public DateTime? Deadline { get; set; }
        public List<string> TeamMembers { get; set; } = new List<string>();
        public List<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        public ICollection<TaskList> TaskLists { get; set; } = new List<TaskList>();
        public ICollection<UserProjectRole> UserRoles { get; set; } = new List<UserProjectRole>();

    }
}

