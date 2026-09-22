using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnergySlotController : ControllerBase
    {
        private readonly EnergySlotService _service;

        public EnergySlotController(EnergySlotService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var slots = await _service.GetAllSlotsAsync();
            return Ok(slots);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var slot = await _service.GetSlotByIdAsync(id);
            if (slot == null) return NotFound(new { message = "Energy slot not found." });
            return Ok(slot);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var slots = await _service.GetSlotsByStatusAsync(status);
            return Ok(slots);
        }

        [HttpGet("prosumer/{prosumerId}")]
        public async Task<IActionResult> GetByProsumer(string prosumerId)
        {
            var slots = await _service.GetSlotsByProsumerAsync(prosumerId);
            return Ok(slots);
        }

        [HttpGet("node/{nodeId}")]
        public async Task<IActionResult> GetByNode(string nodeId)
        {
            var slots = await _service.GetSlotsByNodeAsync(nodeId);
            return Ok(slots);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] EnergySlotDto dto)
        {
            var result = await _service.CreateSlotAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] EnergySlotDto dto)
        {
            var result = await _service.UpdateSlotAsync(id, dto);
            if (result == null) return NotFound(new { message = "Energy slot not found." });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _service.DeleteSlotAsync(id);
            if (!result) return NotFound(new { message = "Energy slot not found." });
            return Ok(new { message = "Energy slot deleted successfully." });
        }
    }
}
