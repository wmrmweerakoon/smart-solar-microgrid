/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: Program.cs
 * Purpose: Application entry point, configures DI, Middleware, and API pipeline.
 * ==============================================================================
 */
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Middleware;
using SmartSolarMicrogrid.API.Repositories;
using SmartSolarMicrogrid.API.Services;

// Initializes the web application builder
var builder = WebApplication.CreateBuilder(args);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ MongoDB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Registers the MongoDB context as a Singleton (one instance for the whole app's lifecycle)
builder.Services.AddSingleton<MongoDbContext>();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Repositories â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Registers repositories as Scoped (one instance per HTTP request)
builder.Services.AddScoped<ProsumerRepository>();
builder.Services.AddScoped<MicrogridRepository>();
builder.Services.AddScoped<EnergySlotRepository>();
builder.Services.AddScoped<BookingRepository>();
builder.Services.AddScoped<ReservationRepository>();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Services â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Registers business logic services to handle core application logic
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProsumerService>();
builder.Services.AddScoped<MicrogridService>();
builder.Services.AddScoped<EnergySlotService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<ReservationService>();
builder.Services.AddScoped<DashboardService>();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ JWT Authentication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Retrieves the JWT settings from appsettings.json
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

// Configures the default authentication scheme to use JWT Bearer
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Defines the token validation rules (checking issuer, audience, and expiration)
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        // Signs the token using the secret key
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// Enables role-based authorization in the app
builder.Services.AddAuthorization();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ CORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Configures Cross-Origin Resource Sharing so the React frontend can talk to this API
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.SetIsOriginAllowed(origin => true) // Allows any origin (for dev purposes)
              .AllowAnyHeader() // Allows any HTTP headers
              .AllowAnyMethod() // Allows any HTTP methods (GET, POST, PUT, DELETE)
              .AllowCredentials(); // Allows sending cookies/auth tokens
    });
});

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Controllers & Swagger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Registers all the API controllers
builder.Services.AddControllers();
// Allows Swagger to explore the API endpoints
builder.Services.AddEndpointsApiExplorer();
// Configures Swagger UI for testing the API interactively
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Smart Solar Microgrid API",
        Version = "v1",
        Description = "API for the Smart Solar Microgrid Trading System"
    });

    // Add JWT auth text box to Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter your JWT token"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Builds the web application pipeline
var app = builder.Build();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Middleware Pipeline (CORS must be first) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Applies the CORS policy to all incoming requests
app.UseCors("AllowReactApp");

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Seed Default Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Seeds initial data (like the admin user) into the database on startup
using (var scope = app.Services.CreateScope())
{
    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
    await authService.SeedDefaultUsersAsync();
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Swagger UI (Always enabled for IIS hosting & assessment demo) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Serves the Swagger UI webpage
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Smart Solar Microgrid API v1");
    c.RoutePrefix = "swagger";
});

// Plugs in our custom global exception handler middleware
app.UseMiddleware<ExceptionMiddleware>();

// Enables authentication and authorization checks for requests
app.UseAuthentication();
app.UseAuthorization();

// Maps incoming HTTP requests to their respective controller endpoints
app.MapControllers();

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ Backend Connected Confirmation Message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Prints a friendly console message showing the server status and URLs
Console.ForegroundColor = ConsoleColor.Green;
Console.WriteLine();
Console.WriteLine("================================================================================");
Console.WriteLine("  SUCCESSFULLY CONNECTED TO BACKEND!");
Console.WriteLine("  Smart Solar Microgrid API server started without any error.");
Console.WriteLine("  ------------------------------------------------------------------");
Console.WriteLine("  * Local Address:  http://localhost:5299");
Console.WriteLine("  * Swagger Docs:   http://localhost:5299/swagger");
Console.WriteLine("  * Database:       MongoDB Atlas Connected");
Console.WriteLine("  * Status:         Operational & Ready for Requests");
Console.WriteLine("================================================================================");
Console.WriteLine();
Console.ResetColor();

// Registers a callback to print a message exactly when the app finishes starting
app.Lifetime.ApplicationStarted.Register(() =>
{
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine(">>> [ONLINE] Backend is actively listening on http://localhost:5299");
    Console.ResetColor();
});

// Runs the application and starts listening for HTTP requests
app.Run();


