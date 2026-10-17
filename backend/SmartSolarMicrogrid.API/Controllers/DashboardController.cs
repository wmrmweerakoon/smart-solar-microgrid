/*
 * File: DashboardController.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Handles HTTP requests and responses for Dashboard operations.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.API.Services;

namespace SmartSolarMicrogrid.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly DashboardService _dashboardService;

        public DashboardController(DashboardService dashboardService)
        {
            // Initializes the controller with required services
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Get comprehensive dashboard summary statistics dynamically.
        /// Includes pending reservations and approved future reservations per the marking scheme.
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            // Retrieves stats from the system
            var stats = await _dashboardService.GetDashboardStatsAsync();
            return Ok(stats);
        }

        /// <summary>
        /// Get live operational monitoring data and recent booking events.
        /// </summary>
        [HttpGet("monitoring")]
        public async Task<IActionResult> GetMonitoring()
        {
            // Retrieves monitoring from the system
            var stats = await _dashboardService.GetDashboardStatsAsync();
            return Ok(new
            {
                stats.CurrentBookings,
                stats.PendingBookings,
                stats.CompletedBookings,
                stats.PendingReservations,
                stats.ApprovedFutureReservations,
                stats.TotalEnergyTradedKWh,
                stats.TotalRevenueTraded,
                stats.RecentBookings
            });
        }
    }
}
