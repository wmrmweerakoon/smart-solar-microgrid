using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _service;

        public BookingController(BookingService service)
        {
            _service = service;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentBookings()
        {
            var bookings = await _service.GetCurrentBookingsAsync();
            return Ok(bookings);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingBookings()
        {
            var bookings = await _service.GetPendingBookingsAsync();
            return Ok(bookings);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetBookingHistory()
        {
            var bookings = await _service.GetBookingHistoryAsync();
            return Ok(bookings);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var booking = await _service.GetBookingByIdAsync(id);
            if (booking == null) return NotFound(new { message = "Booking not found." });
            return Ok(booking);
        }

        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> Confirm(string id)
        {
            var result = await _service.ConfirmBookingAsync(id);
            if (!result) return NotFound(new { message = "Booking not found." });
            return Ok(new { message = "Booking confirmed successfully." });
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(string id)
        {
            var result = await _service.CompleteBookingAsync(id);
            if (!result) return NotFound(new { message = "Booking not found." });
            return Ok(new { message = "Booking completed successfully." });
        }

        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            var result = await _service.CancelBookingAsync(id);
            if (!result) return NotFound(new { message = "Booking not found." });
            return Ok(new { message = "Booking cancelled successfully." });
        }
    }
}
