/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: MicrogridController.cs
 * Purpose: Handles incoming HTTP requests and API routing for Microgrid operations.
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
    public class MicrogridController : ControllerBase
    {
        private readonly MicrogridService _service;

        public MicrogridController(MicrogridService service)
        {
            _service = service;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            // Executes the GetAll operation flow
            var nodes = await _service.GetAllNodesAsync();
            return Ok(nodes);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(string id)
        {
            // Executes the GetById operation flow
            var node = await _service.GetNodeByIdAsync(id);
            if (node == null) return NotFound(new { message = "Microgrid node not found." });
            return Ok(node);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            // Executes the GetByStatus operation flow
            var nodes = await _service.GetNodesByStatusAsync(status);
            return Ok(nodes);
        }

        [HttpPost]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Create([FromBody] MicrogridNodeDto dto)
        {
            // Executes the Create operation flow
            try
            {
                var result = await _service.CreateNodeAsync(dto);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Update(string id, [FromBody] MicrogridNodeDto dto)
        {
            // Executes the Update operation flow
            try
            {
                var result = await _service.UpdateNodeAsync(id, dto);
                if (result == null) return NotFound(new { message = "Microgrid node not found." });
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Backoffice")]
        public async Task<IActionResult> Delete(string id)
        {
            // Executes the Delete operation flow
            var success = await _service.DeleteNodeAsync(id);
            if (!success) return NotFound(new { message = "Node not found." });
            return NoContent();
        }

        [HttpPut("{id}/deactivate")]
        [Authorize(Roles = "Backoffice,GridOperator")]
        public async Task<IActionResult> Deactivate(string id)
        {
            // Executes the Deactivate operation flow
            try
            {
                var updatedNode = await _service.DeactivateNodeAsync(id);
                if (updatedNode == null) return NotFound(new { message = "Node not found." });
                return Ok(updatedNode);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}


