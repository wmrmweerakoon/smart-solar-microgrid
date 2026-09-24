using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Middleware;
using SmartSolarMicrogrid.API.Repositories;
using SmartSolarMicrogrid.API.Services;

var builder = WebApplication.CreateBuilder(args);

// ──────────────── MongoDB ────────────────
builder.Services.AddSingleton<MongoDbContext>();

// ──────────────── Repositories ────────────────
builder.Services.AddScoped<ProsumerRepository>();
builder.Services.AddScoped<MicrogridRepository>();
builder.Services.AddScoped<EnergySlotRepository>();
builder.Services.AddScoped<BookingRepository>();
builder.Services.AddScoped<ReservationRepository>();

// ──────────────── Services ────────────────
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<ProsumerService>();
builder.Services.AddScoped<MicrogridService>();
builder.Services.AddScoped<EnergySlotService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<ReservationService>();
builder.Services.AddScoped<DashboardService>();

// ──────────────── JWT Authentication ────────────────
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

builder.Services.AddAuthorization();

// ──────────────── CORS ────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ──────────────── Controllers & Swagger ────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Smart Solar Microgrid API",
        Version = "v1",
        Description = "API for the Smart Solar Microgrid Trading System"
    });

    // Add JWT auth to Swagger UI
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

var app = builder.Build();

// ──────────────── Seed Default Data ────────────────
using (var scope = app.Services.CreateScope())
{
    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
    await authService.SeedDefaultUsersAsync();
}

// ──────────────── Middleware Pipeline ────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
