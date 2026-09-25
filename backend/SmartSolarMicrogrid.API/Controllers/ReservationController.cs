using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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

        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetDetails(string id)
        {
            var details = await _service.GetReservationDetailsByIdAsync(id);
            if (details == null) return NotFound(new { message = "Reservation not found." });
            return Ok(details);
        }

        [HttpGet("status/{status}")]
        public async Task<IActionResult> GetByStatus(string status)
        {
            var reservations = await _service.GetReservationsByStatusAsync(status);
            return Ok(reservations);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateReservationRequest request)
        {
            try
            {
                var result = await _service.CreateReservationAsync(request);
                return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateReservationRequest request)
        {
            try
            {
                var result = await _service.UpdateReservationAsync(id, request);
                if (result == null) return NotFound(new { message = "Reservation not found." });
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> Confirm(string id)
        {
            try
            {
                var result = await _service.ConfirmReservationAsync(id);
                if (!result) return NotFound(new { message = "Reservation not found." });
                return Ok(new { message = "Reservation confirmed successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            try
            {
                var result = await _service.CancelReservationAsync(id);
                if (!result) return NotFound(new { message = "Reservation not found." });
                return Ok(new { message = "Reservation cancelled successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(string id)
        {
            try
            {
                var result = await _service.CompleteReservationAsync(id);
                if (!result) return NotFound(new { message = "Reservation not found." });
                return Ok(new { message = "Reservation completed successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
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
