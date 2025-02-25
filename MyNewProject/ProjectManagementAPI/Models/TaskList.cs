namespace ProjectManagementAPI.Models
{
    public class TaskList
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int ProjectId { get; set; } 
        public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
        public int Order { get; set; } 
    }

}
