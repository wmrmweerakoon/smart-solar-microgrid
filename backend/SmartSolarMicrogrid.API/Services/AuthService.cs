using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Services
{
    /// <summary>
    /// Authentication service handling login, JWT token generation, and user seeding.
    /// Follows the FAT Service pattern – all auth business logic resides here.
    /// </summary>
    public class AuthService
    {
        private readonly MongoDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(MongoDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Authenticate a user and return a JWT token with role claims.
        /// </summary>
        public async Task<LoginResponse?> LoginAsync(LoginRequest request)
        {
            var cleanUsername = request.Username?.Trim() ?? string.Empty;
            var user = await _context.Users
                .Find(u => u.Username.ToLower() == cleanUsername.ToLower())
                .FirstOrDefaultAsync();

            if (user == null)
                return null;

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return null;

            if (!user.IsActive)
                return null;

            var token = GenerateJwtToken(user);

            return new LoginResponse
            {
                Token = token,
                Username = user.Username,
                Role = user.Role,
                FullName = user.FullName,
                UserId = user.Id
            };
        }

        /// <summary>
        /// Get all users (for admin display).
        /// </summary>
        public async Task<List<UserDto>> GetAllUsersAsync()
        {
            var users = await _context.Users.Find(_ => true).ToListAsync();
            return users.Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                Role = u.Role,
                FullName = u.FullName,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt
            }).ToList();
        }

        /// <summary>
        /// Seed default admin and operator users if missing or reset their passwords.
        /// Called during application startup.
        /// </summary>
        public async Task SeedDefaultUsersAsync()
        {
            var adminUser = await _context.Users.Find(u => u.Username.ToLower() == "admin").FirstOrDefaultAsync();
            if (adminUser == null)
            {
                await _context.Users.InsertOneAsync(new User
                {
                    Username = "admin",
                    Email = "admin@smartsolar.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"),
                    Role = "Backoffice",
                    FullName = "System Administrator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var update = Builders<User>.Update
                    .Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword("admin123"))
                    .Set(u => u.IsActive, true)
                    .Set(u => u.Role, "Backoffice");
                await _context.Users.UpdateOneAsync(u => u.Id == adminUser.Id, update);
            }

            var operatorUser = await _context.Users.Find(u => u.Username.ToLower() == "gridoperator").FirstOrDefaultAsync();
            if (operatorUser == null)
            {
                await _context.Users.InsertOneAsync(new User
                {
                    Username = "gridoperator",
                    Email = "operator@smartsolar.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("operator123"),
                    Role = "GridOperator",
                    FullName = "Grid Operator",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }
            else
            {
                var update = Builders<User>.Update
                    .Set(u => u.PasswordHash, BCrypt.Net.BCrypt.HashPassword("operator123"))
                    .Set(u => u.IsActive, true)
                    .Set(u => u.Role, "GridOperator");
                await _context.Users.UpdateOneAsync(u => u.Id == operatorUser.Id, update);
            }
        }

        /// <summary>
        /// Generate a JWT token with user claims.
        /// </summary>
        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"]!;
            var issuer = jwtSettings["Issuer"]!;
            var audience = jwtSettings["Audience"]!;
            var expiryMinutes = int.Parse(jwtSettings["ExpiryInMinutes"]!);

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("fullName", user.FullName)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
