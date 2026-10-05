/*
 * File: EnergySlotController.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Handles HTTP requests and responses for EnergySlot operations.
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
            // Initializes the controller with required services
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            // Retrieves all from the system
            var slots = await _service.GetAllSlotsAsync();
            return Ok(slots);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            // Retrieves by id from the system
            var slot = await _service.GetSlotByIdAsync(id);
            if (slot == null) return NotFound(new { message = "Energy slot not found." });
            return Ok(slot);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            // Retrieves by status from the system
            var slots = await _service.GetSlotsByStatusAsync(status);
            return Ok(slots);
        }

        [HttpGet("prosumer/{prosumerId}")]
        public async Task<IActionResult> GetByProsumer(string prosumerId)
        {
            // Retrieves by prosumer from the system
            var slots = await _service.GetSlotsByProsumerAsync(prosumerId);
            return Ok(slots);
        }

        [HttpGet("node/{nodeId}")]
        public async Task<IActionResult> GetByNode(string nodeId)
        {
            // Retrieves by node from the system
            var slots = await _service.GetSlotsByNodeAsync(nodeId);
            return Ok(slots);
        }

        [HttpPost]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Create([FromBody] EnergySlotDto dto)
        {
            // Adds a new  to the system
            var result = await _service.CreateSlotAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Update(string id, [FromBody] EnergySlotDto dto)
        {
            // Modifies the existing 
            var result = await _service.UpdateSlotAsync(id, dto);
            if (result == null) return NotFound(new { message = "Energy slot not found." });
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Delete(string id)
        {
            // Deletes the specified 
            var result = await _service.DeleteSlotAsync(id);
            if (!result) return NotFound(new { message = "Energy slot not found." });
            return Ok(new { message = "Energy slot deleted successfully." });
        }
    }
}
