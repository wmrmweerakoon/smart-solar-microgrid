using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var prosumer = await _service.GetProsumerByIdAsync(id);
            if (prosumer == null) return NotFound(new { message = "Prosumer not found." });
            return Ok(prosumer);
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
        public async Task<IActionResult> Create([FromBody] ProsumerDto dto)
        {
            var result = await _service.CreateProsumerAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ProsumerDto dto)
        {
            var result = await _service.UpdateProsumerAsync(id, dto);
            if (result == null) return NotFound(new { message = "Prosumer not found." });
            return Ok(result);
        }

        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(string id)
        {
            var username = User.Identity?.Name ?? "system";
            var result = await _service.ActivateProsumerAsync(id, username);
            if (!result) return NotFound(new { message = "Prosumer not found." });
            return Ok(new { message = "Prosumer activated successfully." });
        }

        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var result = await _service.DeactivateProsumerAsync(id);
            if (!result) return NotFound(new { message = "Prosumer not found." });
            return Ok(new { message = "Prosumer deactivated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _service.DeleteProsumerAsync(id);
            if (!result) return NotFound(new { message = "Prosumer not found." });
            return Ok(new { message = "Prosumer deleted successfully." });
        }
    }
}
