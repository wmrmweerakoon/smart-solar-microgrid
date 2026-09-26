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
            {
                // Check if it's a Prosumer logging in via NIC or Email
                var prosumer = await _context.Prosumers
                    .Find(p => p.Nic.ToLower() == cleanUsername.ToLower() || (!string.IsNullOrEmpty(p.Email) && p.Email.ToLower() == cleanUsername.ToLower()))
                    .FirstOrDefaultAsync();

                if (prosumer == null)
                    return null;

                if (string.IsNullOrEmpty(prosumer.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, prosumer.PasswordHash))
                    return null;

                if (prosumer.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Your account is pending activation by Backoffice.");

                if (prosumer.Status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
                    throw new InvalidOperationException("Your account is deactivated. Please contact support.");

                var prosumerToken = GenerateJwtTokenForProsumer(prosumer);

                return new LoginResponse
                {
                    Token = prosumerToken,
                    Username = prosumer.Nic,
                    Role = "Prosumer",
                    FullName = prosumer.Name,
                    UserId = prosumer.Nic
                };
            }

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
        /// Create a new web application user (Backoffice only).
        /// Role must be "Backoffice" or "GridOperator".
        /// </summary>
        public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                throw new InvalidOperationException("Username is required.");

            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
                throw new InvalidOperationException("Password must be at least 6 characters long.");

            var cleanRole = request.Role?.Trim();
            if (cleanRole != "Backoffice" && cleanRole != "GridOperator")
                throw new InvalidOperationException("Invalid role. Role must be either 'Backoffice' or 'GridOperator'.");

            var cleanUsername = request.Username.Trim();
            var existing = await _context.Users
                .Find(u => u.Username.ToLower() == cleanUsername.ToLower())
                .FirstOrDefaultAsync();

            if (existing != null)
                throw new InvalidOperationException($"Username '{cleanUsername}' is already taken.");

            var newUser = new User
            {
                Username = cleanUsername,
                Email = request.Email?.Trim() ?? string.Empty,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = cleanRole,
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? cleanUsername : request.FullName.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.InsertOneAsync(newUser);

            return new UserDto
            {
                Id = newUser.Id,
                Username = newUser.Username,
                Email = newUser.Email,
                Role = newUser.Role,
                FullName = newUser.FullName,
                IsActive = newUser.IsActive,
                CreatedAt = newUser.CreatedAt
            };
        }

        /// <summary>
        /// Toggle user active status.
        /// </summary>
        public async Task<bool> SetUserStatusAsync(string id, bool isActive)
        {
            var update = Builders<User>.Update
                .Set(u => u.IsActive, isActive)
                .Set(u => u.UpdatedAt, DateTime.UtcNow);

            var res = await _context.Users.UpdateOneAsync(u => u.Id == id, update);
            return res.ModifiedCount > 0;
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

        /// <summary>
        /// Self-register a prosumer from mobile app.
        /// Prosumer starts in "Pending" status until activated by Backoffice.
        /// </summary>
        public async Task<ProsumerDto> RegisterProsumerAsync(RegisterProsumerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Nic))
                throw new ArgumentException("NIC is required.");

            var cleanNic = dto.Nic.Trim();
            if (!System.Text.RegularExpressions.Regex.IsMatch(cleanNic, @"^([0-9]{9}[vVxX]|[0-9]{12})$"))
                throw new ArgumentException("Invalid NIC format. Must be either 9 digits followed by V/X or 12 digits.");

            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
                throw new ArgumentException("Password must be at least 6 characters long.");

            var existing = await _context.Prosumers.Find(p => p.Nic.ToLower() == cleanNic.ToLower()).FirstOrDefaultAsync();
            if (existing != null)
                throw new InvalidOperationException($"A prosumer with NIC '{cleanNic}' is already registered.");

            var prosumer = new Prosumer
            {
                Nic = cleanNic,
                Name = dto.Name?.Trim() ?? string.Empty,
                Email = dto.Email?.Trim() ?? string.Empty,
                Phone = dto.Phone?.Trim() ?? string.Empty,
                Address = dto.Address?.Trim() ?? string.Empty,
                MicrogridNodeId = dto.MicrogridNodeId?.Trim() ?? string.Empty,
                SolarCapacity = dto.SolarCapacity,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Prosumers.InsertOneAsync(prosumer);

            return new ProsumerDto
            {
                Nic = prosumer.Nic,
                Name = prosumer.Name,
                Email = prosumer.Email,
                Phone = prosumer.Phone,
                Address = prosumer.Address,
                MicrogridNodeId = prosumer.MicrogridNodeId,
                SolarCapacity = prosumer.SolarCapacity,
                Status = prosumer.Status,
                CreatedAt = prosumer.CreatedAt,
                UpdatedAt = prosumer.UpdatedAt
            };
        }

        /// <summary>
        /// Generate a JWT token with prosumer claims.
        /// </summary>
        private string GenerateJwtTokenForProsumer(Prosumer prosumer)
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
                new Claim(ClaimTypes.NameIdentifier, prosumer.Nic),
                new Claim(ClaimTypes.Name, prosumer.Nic),
                new Claim(ClaimTypes.Email, prosumer.Email),
                new Claim(ClaimTypes.Role, "Prosumer"),
                new Claim("fullName", prosumer.Name),
                new Claim("nic", prosumer.Nic)
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
