using Microsoft.EntityFrameworkCore;
using ProjectManagementAPI.Models;
using System;

namespace ProjectManagementAPI.Data
{
    public class AppDbContext : DbContext
    {
        protected readonly IConfiguration Configuration;

        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
            Console.WriteLine("🟢 AppDbContext: Konstruktor został wywołany!");
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserProjectRole> UserProjectRoles { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<TaskList> TaskLists { get; set; }
        public DbSet<TaskItem> Tasks { get; set; }

    }
}
