/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * System Module Documentation
 * ==============================================================================
 */
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
            // Executes the GetAll operation flow
            var slots = await _service.GetAllSlotsAsync();
            return Ok(slots);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            // Executes the GetById operation flow
            var slot = await _service.GetSlotByIdAsync(id);
            if (slot == null) return NotFound(new { message = "Energy slot not found." });
            return Ok(slot);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            // Executes the GetByStatus operation flow
            var slots = await _service.GetSlotsByStatusAsync(status);
            return Ok(slots);
        }

        [HttpGet("prosumer/{prosumerId}")]
        public async Task<IActionResult> GetByProsumer(string prosumerId)
        {
            // Executes the GetByProsumer operation flow
            var slots = await _service.GetSlotsByProsumerAsync(prosumerId);
            return Ok(slots);
        }

        [HttpGet("node/{nodeId}")]
        public async Task<IActionResult> GetByNode(string nodeId)
        {
            // Executes the GetByNode operation flow
            var slots = await _service.GetSlotsByNodeAsync(nodeId);
            return Ok(slots);
        }

        [HttpPost]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Create([FromBody] EnergySlotDto dto)
        {
            // Executes the Create operation flow
            var result = await _service.CreateSlotAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Update(string id, [FromBody] EnergySlotDto dto)
        {
            // Executes the Update operation flow
            var result = await _service.UpdateSlotAsync(id, dto);
            if (result == null) return NotFound(new { message = "Energy slot not found." });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Delete(string id)
        {
            // Executes the Delete operation flow
            var result = await _service.DeleteSlotAsync(id);
            if (!result) return NotFound(new { message = "Energy slot not found." });
            return Ok(new { message = "Energy slot deleted successfully." });
        }
    }
}

