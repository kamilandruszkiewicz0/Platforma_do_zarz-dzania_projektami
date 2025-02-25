using Amazon.Lambda.APIGatewayEvents;
using Amazon.Lambda.AspNetCoreServer;
using Amazon.Lambda.Core;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using System;
using System.Threading.Tasks;
using ProjectManagementAPI.Data;
using Microsoft.EntityFrameworkCore;


namespace ProjectManagementAPI
{
    public class LambdaEntryPoint : APIGatewayProxyFunction
    {
        protected override void Init(IHostBuilder builder)
        {
            Console.WriteLine("🔧 Inicjalizacja aplikacji w LambdaEntryPoint...");

            builder.ConfigureWebHostDefaults(webBuilder =>
            {
                Console.WriteLine("🔧 Konfiguracja aplikacji...");

                webBuilder.ConfigureServices(services =>
                {
                    Console.WriteLine("🔧 Rejestrowanie usług...");
                    
                    services.AddControllers();
                    
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseNpgsql(Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")));
                    Console.WriteLine("✅ `AppDbContext` zarejestrowany w LambdaEntryPoint!");

                    services.AddCors(options =>
                    {
                        options.AddPolicy("AllowAll", policy =>
                        {
                            policy.AllowAnyOrigin()
                                .AllowAnyMethod()
                                .AllowAnyHeader();
                        });
                    });

                    services.AddAuthentication();
                    services.AddAuthorization();
                });

                webBuilder.Configure(app =>
                {
                    Console.WriteLine("🔧 Konfiguracja middleware...");

                    app.UseRouting();
                    app.UseCors("AllowAll");
                    app.UseAuthentication();
                    app.UseAuthorization();
                    
                    app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
                });
            });

            // 🔥 Wymuszamy uruchomienie `Program.cs`
            try
            {
                Console.WriteLine("🚀 Wymuszam uruchomienie `Program.cs`...");
                Program.Main(new string[] { });
                Console.WriteLine("✅ `Program.cs` został uruchomiony.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Błąd uruchamiania `Program.cs`: {ex.Message}");
            }
        }

        public override async Task<APIGatewayProxyResponse> FunctionHandlerAsync(
            APIGatewayProxyRequest request, ILambdaContext lambdaContext)
        {
            try
            {
                Console.WriteLine("🟢 Lambda FunctionHandlerAsync został wywołany");

                string requestJson = System.Text.Json.JsonSerializer.Serialize(request);
                Console.WriteLine($"📥 Pełny request: {requestJson}");

                if (request == null)
                {
                    Console.WriteLine("❌ BŁĄD: request jest null!");
                    return new APIGatewayProxyResponse { StatusCode = 500, Body = "Request is null" };
                }

                return await base.FunctionHandlerAsync(request, lambdaContext);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Wystąpił wyjątek w FunctionHandlerAsync: {ex.Message}");
                return new APIGatewayProxyResponse { StatusCode = 500, Body = $"Internal Server Error: {ex.Message}" };
            }
        }
    }
}
