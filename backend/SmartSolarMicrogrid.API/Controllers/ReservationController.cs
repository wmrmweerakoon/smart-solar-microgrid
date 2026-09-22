using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationController : ControllerBase
    {
        private readonly ReservationService _service;

        public ReservationController(ReservationService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var reservations = await _service.GetAllReservationsAsync();
            return Ok(reservations);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var reservation = await _service.GetReservationByIdAsync(id);
            if (reservation == null) return NotFound(new { message = "Reservation not found." });
            return Ok(reservation);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var reservations = await _service.GetReservationsByStatusAsync(status);
            return Ok(reservations);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ReservationDto dto)
        {
            var result = await _service.CreateReservationAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] ReservationDto dto)
        {
            var result = await _service.UpdateReservationAsync(id, dto);
            if (result == null) return NotFound(new { message = "Reservation not found." });
            return Ok(result);
        }

        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> Confirm(string id)
        {
            var result = await _service.ConfirmReservationAsync(id);
            if (!result) return NotFound(new { message = "Reservation not found." });
            return Ok(new { message = "Reservation confirmed successfully." });
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            var result = await _service.CancelReservationAsync(id);
            if (!result) return NotFound(new { message = "Reservation not found." });
            return Ok(new { message = "Reservation cancelled successfully." });
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(string id)
        {
            var result = await _service.CompleteReservationAsync(id);
            if (!result) return NotFound(new { message = "Reservation not found." });
            return Ok(new { message = "Reservation completed successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _service.DeleteReservationAsync(id);
            if (!result) return NotFound(new { message = "Reservation not found." });
            return Ok(new { message = "Reservation deleted successfully." });
        }
    }
}
