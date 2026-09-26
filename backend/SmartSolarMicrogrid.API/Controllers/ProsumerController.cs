using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    /// <summary>
    /// REST controller for prosumer profile management and account activation/deactivation.
    /// Uses NIC as the primary identifier.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProsumerController : ControllerBase
    {
        private readonly ProsumerService _service;

        public ProsumerController(ProsumerService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var prosumers = await _service.GetAllProsumersAsync();
            return Ok(prosumers);
        }

        [HttpGet("{nic}")]
        public async Task<IActionResult> GetById(string nic)
        {
            var prosumer = await _service.GetProsumerByIdAsync(nic);
            if (prosumer == null) return NotFound(new { message = $"Prosumer with NIC '{nic}' not found." });
            return Ok(prosumer);
        }

        [HttpGet("{nic}/details")]
        public async Task<IActionResult> GetDetails(string nic)
        {
            var details = await _service.GetProsumerDetailsAsync(nic);
            if (details == null) return NotFound(new { message = $"Prosumer with NIC '{nic}' not found." });
            return Ok(details);
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string? query, [FromQuery] string? status, [FromQuery] string? nodeId)
        {
            var prosumers = await _service.SearchProsumersAsync(query, status, nodeId);
            return Ok(prosumers);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var prosumers = await _service.GetProsumersByStatusAsync(status);
            return Ok(prosumers);
        }

        [HttpGet("node/{nodeId}")]
        public async Task<IActionResult> GetByNode(string nodeId)
        {
            var prosumers = await _service.GetProsumersByNodeAsync(nodeId);
            return Ok(prosumers);
        }

        [HttpPost]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Create([FromBody] CreateProsumerDto dto)
        {
            try
            {
                var result = await _service.CreateProsumerAsync(dto);
                return CreatedAtAction(nameof(GetById), new { nic = result.Nic }, result);
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

        [HttpPut("{nic}")]
        [Authorize(Roles = "Backoffice,GridOperator,Prosumer")]
        public async Task<IActionResult> Update(string nic, [FromBody] UpdateProsumerDto dto)
        {
            try
            {
                var result = await _service.UpdateProsumerAsync(nic, dto);
                if (result == null) return NotFound(new { message = $"Prosumer with NIC '{nic}' not found." });
                return Ok(result);
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
        /// Activate a pending or inactive prosumer profile.
        /// Strictly restricted to Backoffice users.
        /// </summary>
        [HttpPut("{nic}/activate")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> Activate(string nic)
        {
            var username = User.FindFirst(ClaimTypes.Name)?.Value 
                        ?? User.Identity?.Name 
                        ?? "BackofficeAdmin";

            var result = await _service.ActivateProsumerAsync(nic, username);
            if (!result) return NotFound(new { message = $"Prosumer with NIC '{nic}' not found." });
            return Ok(new { message = $"Prosumer '{nic}' successfully activated by {username}." });
        }

        /// <summary>
        /// Deactivate a prosumer profile.
        /// Requires confirmation and checks for active reservations.
        /// </summary>
        [HttpPut("{nic}/deactivate")]
        [Authorize(Roles = "Backoffice,GridOperator,Prosumer")]
        public async Task<IActionResult> Deactivate(string nic, [FromBody] DeactivateProsumerDto? dto)
        {
            try
            {
                var reason = dto?.Reason ?? "Administrative deactivation";
                var result = await _service.DeactivateProsumerAsync(nic, reason);
                if (!result) return NotFound(new { message = $"Prosumer with NIC '{nic}' not found." });
                return Ok(new { message = $"Prosumer '{nic}' successfully deactivated." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Permanently remove a prosumer record.
        /// Strictly restricted to Backoffice users.
        /// </summary>
        [HttpDelete("{nic}")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> Delete(string nic)
        {
            try
            {
                var result = await _service.DeleteProsumerAsync(nic);
                if (!result) return NotFound(new { message = $"Prosumer with NIC '{nic}' not found." });
                return Ok(new { message = $"Prosumer '{nic}' deleted successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
