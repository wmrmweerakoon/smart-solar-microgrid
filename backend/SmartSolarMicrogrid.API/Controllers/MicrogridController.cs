using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MicrogridController : ControllerBase
    {
        private readonly MicrogridService _service;

        public MicrogridController(MicrogridService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var nodes = await _service.GetAllNodesAsync();
            return Ok(nodes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var node = await _service.GetNodeByIdAsync(id);
            if (node == null) return NotFound(new { message = "Microgrid node not found." });
            return Ok(node);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var nodes = await _service.GetNodesByStatusAsync(status);
            return Ok(nodes);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MicrogridNodeDto dto)
        {
            var result = await _service.CreateNodeAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] MicrogridNodeDto dto)
        {
            var result = await _service.UpdateNodeAsync(id, dto);
            if (result == null) return NotFound(new { message = "Microgrid node not found." });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _service.DeleteNodeAsync(id);
            if (!result) return NotFound(new { message = "Microgrid node not found." });
            return Ok(new { message = "Microgrid node deleted successfully." });
        }
    }
}
