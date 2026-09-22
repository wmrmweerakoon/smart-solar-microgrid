using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for Booking (EnergySlot with Booked status) data access operations.
    /// Bookings are energy slots that have been claimed by a buyer prosumer.
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
            return await _slots.Find(s => s.Status == "Booked").ToListAsync();
        }

        public async Task<List<EnergySlot>> GetPendingBookingsAsync()
        {
            // Slots that are available and have pending reservations
            var pendingReservations = await _reservations
                .Find(r => r.Status == "Pending")
                .ToListAsync();

            var slotIds = pendingReservations.Select(r => r.EnergySlotId).Distinct().ToList();
            var filter = Builders<EnergySlot>.Filter.In(s => s.Id, slotIds);
            return await _slots.Find(filter).ToListAsync();
        }

        public async Task<List<EnergySlot>> GetBookingHistoryAsync()
        {
            var filter = Builders<EnergySlot>.Filter.In(s => s.Status, new[] { "Completed", "Cancelled" });
            return await _slots.Find(filter).ToListAsync();
        }

        public async Task<EnergySlot?> GetBookingByIdAsync(string id)
        {
            return await _slots.Find(s => s.Id == id).FirstOrDefaultAsync();
        }

        public async Task UpdateBookingStatusAsync(string id, string status)
        {
            var update = Builders<EnergySlot>.Update
                .Set(s => s.Status, status)
                .Set(s => s.UpdatedAt, DateTime.UtcNow);
            await _slots.UpdateOneAsync(s => s.Id == id, update);
        }

        public async Task<long> GetCurrentBookingsCountAsync()
        {
            return await _slots.CountDocumentsAsync(s => s.Status == "Booked");
        }
    }
}
