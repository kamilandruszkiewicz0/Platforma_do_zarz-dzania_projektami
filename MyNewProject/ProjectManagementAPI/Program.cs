using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectManagementAPI.Data;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Amazon.Lambda.AspNetCoreServer.Hosting;
using System;

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("\n\n🚀 `Program.cs` URUCHOMIONY 🚀\n\n");

        var builder = WebApplication.CreateBuilder(args);
        Console.WriteLine("🔧 Inicjalizacja konfiguracji aplikacji...");

        var dbHost = Environment.GetEnvironmentVariable("DB_HOST");
        var dbPort = Environment.GetEnvironmentVariable("DB_PORT");
        var dbName = Environment.GetEnvironmentVariable("DB_NAME");
        var dbUser = Environment.GetEnvironmentVariable("DB_USER");
        var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD");

        Console.WriteLine("🔍 Sprawdzam zmienne środowiskowe bazy danych...");
        Console.WriteLine($"DB_HOST: {dbHost ?? "NULL"}");
        Console.WriteLine($"DB_PORT: {dbPort ?? "NULL"}");
        Console.WriteLine($"DB_NAME: {dbName ?? "NULL"}");
        Console.WriteLine($"DB_USER: {dbUser ?? "NULL"}");
        Console.WriteLine($"DB_PASSWORD: {dbPassword ?? "NULL"}");

        if (string.IsNullOrEmpty(dbHost) || string.IsNullOrEmpty(dbName) || string.IsNullOrEmpty(dbUser) || string.IsNullOrEmpty(dbPassword) || string.IsNullOrEmpty(dbPort))
        {
            throw new Exception("❌ Database connection environment variables are missing!");
        }

        var connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPassword}";
        Console.WriteLine($"📡 Łączenie z bazą danych: {connectionString}");

        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString), ServiceLifetime.Scoped);

        Console.WriteLine("🔍 Sprawdzam `AppDbContext` przed zbudowaniem aplikacji...");
        try
        {
            using (var scope = builder.Services.BuildServiceProvider().CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                Console.WriteLine("✅ `AppDbContext` działa poprawnie.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ `AppDbContext` NIE został poprawnie utworzony: {ex.Message}");
        }
        Console.WriteLine("🔍 Test `AppDbContext` zakończony, kontynuuję uruchamianie aplikacji...");

        var key = Encoding.ASCII.GetBytes(builder.Configuration["Jwt:Secret"]);
        Console.WriteLine("🔑 Konfiguracja JWT zakończona");

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

        Console.WriteLine("🌍 Konfiguracja CORS");
        builder.Services.AddCors(options =>
        {
            options.AddPolicy("AllowSpecificOrigin", policy =>
            {
                policy.WithOrigins("*")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            });
        });

        builder.Services.AddControllers();
        Console.WriteLine("📌 Kontrolery dodane");

        builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);
        Console.WriteLine("☁️ Rejestrowanie AWS Lambda Hosting");

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        Console.WriteLine("📖 Inicjalizacja Swaggera");

        var app = builder.Build();
        Console.WriteLine("🚀 Aplikacja została zbudowana");

        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                context.Response.ContentType = "application/json";
                var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;

                Console.WriteLine($"❌ Wystąpił błąd: {exception?.Message}\n{exception?.StackTrace}");

                var result = JsonSerializer.Serialize(new
                {
                    message = "An internal server error occurred.",
                    details = exception?.Message
                });
                await context.Response.WriteAsync(result);
            });
        });

        if (app.Environment.IsDevelopment())
        {
            Console.WriteLine("🛠️ Uruchamianie Swaggera...");
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseRouting();
        app.UseCors("AllowSpecificOrigin");
        app.UseAuthentication();
        app.UseAuthorization();

        try
        {
            using var scope = builder.Services.BuildServiceProvider().CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            Console.WriteLine("✅ `AppDbContext` został poprawnie utworzony przez DI!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ `AppDbContext` NIE został poprawnie utworzony: {ex.Message}");
        }

        app.MapControllers();
        Console.WriteLine("🟢 Aplikacja ASP.NET Core uruchomiona w Lambda!");

        app.Run();
    }
}
