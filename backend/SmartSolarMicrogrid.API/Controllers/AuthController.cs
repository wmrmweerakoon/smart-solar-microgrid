using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Authenticate a user (Backoffice, GridOperator, or Prosumer) with username/NIC and password.
        /// Returns a JWT token on success.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                return BadRequest(new { message = "Username and password are required." });

            try
            {
                var result = await _authService.LoginAsync(request);

                if (result == null)
                    return Unauthorized(new { message = "Invalid username or password." });

                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Self-register a new prosumer from the mobile application.
        /// Newly registered prosumers start in 'Pending' status until approved by Backoffice.
        /// </summary>
        [HttpPost("prosumer/register")]
        public async Task<IActionResult> RegisterProsumer([FromBody] RegisterProsumerDto dto)
        {
            try
            {
                var result = await _authService.RegisterProsumerAsync(dto);
                return CreatedAtAction("GetById", "Prosumer", new { nic = result.Nic }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get all web application users (Backoffice only).
        /// </summary>
        [HttpGet("users")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _authService.GetAllUsersAsync();
            return Ok(users);
        }

        /// <summary>
        /// Create a new web application user (Backoffice only).
        /// Roles supported: "Backoffice", "GridOperator".
        /// </summary>
        [HttpPost("users")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            try
            {
                var newUser = await _authService.CreateUserAsync(request);
                return CreatedAtAction(nameof(GetUsers), new { id = newUser.Id }, newUser);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Update user active status (Backoffice only).
        /// </summary>
        [HttpPut("users/{id}/status")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateUserStatusRequest request)
        {
            var success = await _authService.SetUserStatusAsync(id, request.IsActive);
            if (!success)
                return NotFound(new { message = "User not found." });

            return Ok(new { message = $"User status updated to {(request.IsActive ? "Active" : "Inactive")}." });
        }
    }

    public class UpdateUserStatusRequest
    {
        public bool IsActive { get; set; }
    }
}
