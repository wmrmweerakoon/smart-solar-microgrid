using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly ProsumerService _prosumerService;
        private readonly MicrogridService _microgridService;
        private readonly EnergySlotService _energySlotService;
        private readonly BookingService _bookingService;
        private readonly ReservationService _reservationService;

        public DashboardController(
            ProsumerService prosumerService,
            MicrogridService microgridService,
            EnergySlotService energySlotService,
            BookingService bookingService,
            ReservationService reservationService)
        {
            _prosumerService = prosumerService;
            _microgridService = microgridService;
            _energySlotService = energySlotService;
            _bookingService = bookingService;
            _reservationService = reservationService;
        }

        /// <summary>
        /// Get dashboard summary statistics.
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var stats = new
            {
                TotalProsumers = await _prosumerService.GetCountAsync(),
                PendingProsumers = await _prosumerService.GetPendingCountAsync(),
                TotalNodes = await _microgridService.GetCountAsync(),
                ActiveNodes = await _microgridService.GetActiveCountAsync(),
                TotalEnergySlots = await _energySlotService.GetCountAsync(),
                AvailableSlots = await _energySlotService.GetAvailableCountAsync(),
                CurrentBookings = await _bookingService.GetCurrentBookingsCountAsync(),
                TotalReservations = await _reservationService.GetCountAsync(),
                PendingReservations = await _reservationService.GetPendingCountAsync()
            };

            return Ok(stats);
        }
    }
}
