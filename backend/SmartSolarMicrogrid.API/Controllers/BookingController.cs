using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Models;
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

        /// <summary>
        /// Get active/current bookings with full prosumer and node details.
        /// </summary>
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentBookings()
        {
            var bookings = await _service.GetCurrentBookingsAsync();
            return Ok(bookings);
        }

        /// <summary>
        /// Get pending bookings awaiting confirmation.
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingBookings()
        {
            var bookings = await _service.GetPendingBookingsAsync();
            return Ok(bookings);
        }

        /// <summary>
        /// Get full booking history (completed and cancelled bookings).
        /// </summary>
        [HttpGet("history")]
        public async Task<IActionResult> GetBookingHistory()
        {
            var bookings = await _service.GetBookingHistoryAsync();
            return Ok(bookings);
        }

        /// <summary>
        /// Search and filter bookings by keyword, status, node, date, and prosumer.
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] BookingFilterRequest request)
        {
            var bookings = await _service.SearchBookingsAsync(request);
            return Ok(bookings);
        }

        /// <summary>
        /// Get booking summary by slot ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var booking = await _service.GetBookingByIdAsync(id);
            if (booking == null) return NotFound(new { message = "Booking not found." });
            return Ok(booking);
        }

        /// <summary>
        /// Get complete booking operational details including prosumer contact details and microgrid info.
        /// </summary>
        [HttpGet("{id}/details")]
        public async Task<IActionResult> GetDetails(string id)
        {
            var details = await _service.GetBookingDetailsByIdAsync(id);
            if (details == null) return NotFound(new { message = "Booking details not found." });
            return Ok(details);
        }

        /// <summary>
        /// Approve/confirm a pending booking.
        /// </summary>
        [HttpPut("{id}/confirm")]
        public async Task<IActionResult> Confirm(string id)
        {
            var result = await _service.ConfirmBookingAsync(id);
            if (!result) return NotFound(new { message = "Booking not found." });
            return Ok(new { message = "Booking confirmed successfully." });
        }

        /// <summary>
        /// Mark a current booking as completed.
        /// </summary>
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> Complete(string id)
        {
            var result = await _service.CompleteBookingAsync(id);
            if (!result) return NotFound(new { message = "Booking not found." });
            return Ok(new { message = "Booking marked as completed successfully." });
        }

        /// <summary>
        /// Cancel a current or pending booking.
        /// </summary>
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> Cancel(string id)
        {
            var result = await _service.CancelBookingAsync(id);
            if (!result) return NotFound(new { message = "Booking not found." });
            return Ok(new { message = "Booking cancelled successfully." });
        }
    }
}
