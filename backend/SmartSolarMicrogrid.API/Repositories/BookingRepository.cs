using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for Booking (EnergySlot & Reservation integration) data access operations.
    /// Bookings represent energy slots that are active, pending confirmation, or have concluded.
    /// </summary>
    public class BookingRepository
    {
        private readonly IMongoCollection<EnergySlot> _slots;
        private readonly IMongoCollection<Reservation> _reservations;

        public BookingRepository(MongoDbContext context)
        {
            _slots = context.EnergySlots;
            _reservations = context.Reservations;
        }

        public async Task<List<EnergySlot>> GetCurrentBookingsAsync()
        {
            return await _slots.Find(s => s.Status == "Booked")
                               .SortByDescending(s => s.SlotDate)
                               .ToListAsync();
        }

        public async Task<List<EnergySlot>> GetPendingBookingsAsync()
        {
            // Slots that have pending reservations, or slots explicitly in Pending status
            var pendingReservations = await _reservations
                .Find(r => r.Status == "Pending")
                .ToListAsync();

            var slotIds = pendingReservations.Select(r => r.EnergySlotId).Distinct().ToList();

            var filter = Builders<EnergySlot>.Filter.Or(
                Builders<EnergySlot>.Filter.In(s => s.Id, slotIds),
                Builders<EnergySlot>.Filter.Eq(s => s.Status, "Pending")
            );

            return await _slots.Find(filter)
                               .SortByDescending(s => s.SlotDate)
                               .ToListAsync();
        }

        public async Task<List<EnergySlot>> GetBookingHistoryAsync()
        {
            var filter = Builders<EnergySlot>.Filter.In(s => s.Status, new[] { "Completed", "Cancelled" });
            return await _slots.Find(filter)
                               .SortByDescending(s => s.SlotDate)
                               .ToListAsync();
        }

        public async Task<EnergySlot?> GetBookingByIdAsync(string id)
        {
            return await _slots.Find(s => s.Id == id).FirstOrDefaultAsync();
        }

        public async Task<Reservation?> GetReservationBySlotIdAsync(string slotId)
        {
            return await _reservations.Find(r => r.EnergySlotId == slotId)
                                      .SortByDescending(r => r.ReservedAt)
                                      .FirstOrDefaultAsync();
        }

        public async Task<List<Reservation>> GetReservationsForSlotsAsync(IEnumerable<string> slotIds)
        {
            var filter = Builders<Reservation>.Filter.In(r => r.EnergySlotId, slotIds);
            return await _reservations.Find(filter).ToListAsync();
        }

        public async Task UpdateBookingStatusAsync(string id, string status)
        {
            var update = Builders<EnergySlot>.Update
                .Set(s => s.Status, status)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);
            await _slots.UpdateOneAsync(s => s.Id == id, update);
        }

        public async Task UpdateReservationStatusBySlotIdAsync(string slotId, string status)
        {
            var update = Builders<Reservation>.Update
                .Set(r => r.Status, status)
                .Set(r => r.UpdatedAt, DateTime.UtcNow);
            await _reservations.UpdateManyAsync(r => r.EnergySlotId == slotId, update);
        }

        public async Task<long> GetCurrentBookingsCountAsync()
        {
            return await _slots.CountDocumentsAsync(s => s.Status == "Booked");
        }

        public async Task<long> GetPendingBookingsCountAsync()
        {
            var pendingReservationsCount = await _reservations.CountDocumentsAsync(r => r.Status == "Pending");
            var pendingSlotsCount = await _slots.CountDocumentsAsync(s => s.Status == "Pending");
            return Math.Max(pendingReservationsCount, pendingSlotsCount);
        }

        public async Task<long> GetCompletedBookingsCountAsync()
        {
            return await _slots.CountDocumentsAsync(s => s.Status == "Completed");
        }

        public async Task<List<EnergySlot>> SearchBookingsAsync(string? status, string? nodeId, DateTime? date, string? prosumerId)
        {
            var filters = new List<FilterDefinition<EnergySlot>>();

            // Status filter
            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                if (status.Equals("Pending", StringComparison.OrdinalIgnoreCase))
                {
                    var pendingReservations = await _reservations.Find(r => r.Status == "Pending").ToListAsync();
                    var slotIds = pendingReservations.Select(r => r.EnergySlotId).Distinct().ToList();
                    filters.Add(Builders<EnergySlot>.Filter.Or(
                        Builders<EnergySlot>.Filter.In(s => s.Id, slotIds),
                        Builders<EnergySlot>.Filter.Eq(s => s.Status, "Pending")
                    ));
                }
                else
                {
                    filters.Add(Builders<EnergySlot>.Filter.Eq(s => s.Status, status));
                }
            }
            else
            {
                // When "All", only show booking-related slots (Booked, Pending, Completed, Cancelled)
                var bookingStatuses = new[] { "Booked", "Pending", "Completed", "Cancelled" };
                filters.Add(Builders<EnergySlot>.Filter.In(s => s.Status, bookingStatuses));
            }

            // Node filter
            if (!string.IsNullOrWhiteSpace(nodeId))
            {
                filters.Add(Builders<EnergySlot>.Filter.Eq(s => s.MicrogridNodeId, nodeId));
            }

            // Date filter
            if (date.HasValue)
            {
                var startOfDay = date.Value.Date;
                var endOfDay = startOfDay.AddDays(1);
                filters.Add(Builders<EnergySlot>.Filter.Gte(s => s.SlotDate, startOfDay));
                filters.Add(Builders<EnergySlot>.Filter.Lt(s => s.SlotDate, endOfDay));
            }

            // Prosumer (seller) filter
            if (!string.IsNullOrWhiteSpace(prosumerId))
            {
                filters.Add(Builders<EnergySlot>.Filter.Eq(s => s.ProsumerId, prosumerId));
            }

            var combinedFilter = filters.Count > 0
                ? Builders<EnergySlot>.Filter.And(filters)
                : Builders<EnergySlot>.Filter.Empty;

            return await _slots.Find(combinedFilter)
                               .SortByDescending(s => s.SlotDate)
                               .ToListAsync();
        }
    }
}
