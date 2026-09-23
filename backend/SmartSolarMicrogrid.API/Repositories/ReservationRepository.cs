using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for Reservation data access operations.
    /// </summary>
    public class ReservationRepository
    {
        private readonly IMongoCollection<Reservation> _reservations;

        public ReservationRepository(MongoDbContext context)
        {
            _reservations = context.Reservations;
        }

        public async Task<List<Reservation>> GetAllAsync()
        {
            return await _reservations.Find(_ => true).ToListAsync();
        }

        public async Task<Reservation?> GetByIdAsync(string id)
        {
            return await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<Reservation>> GetByStatusAsync(string status)
        {
            return await _reservations.Find(r => r.Status == status).ToListAsync();
        }

        public async Task<List<Reservation>> GetByBuyerIdAsync(string buyerId)
        {
            return await _reservations.Find(r => r.BuyerProsumerId == buyerId).ToListAsync();
        }

        public async Task<List<Reservation>> GetBySellerIdAsync(string sellerId)
        {
            return await _reservations.Find(r => r.SellerProsumerId == sellerId).ToListAsync();
        }

        public async Task<List<Reservation>> GetByEnergySlotIdAsync(string slotId)
        {
            return await _reservations.Find(r => r.EnergySlotId == slotId).ToListAsync();
        }

        public async Task<List<Reservation>> GetActiveReservationsByNodeIdAsync(string nodeId)
        {
            return await _reservations.Find(r => r.MicrogridNodeId == nodeId && (r.Status == "Pending" || r.Status == "Confirmed")).ToListAsync();
        }

        public async Task CreateAsync(Reservation reservation)
        {
            await _reservations.InsertOneAsync(reservation);
        }

        public async Task UpdateAsync(string id, Reservation reservation)
        {
            await _reservations.ReplaceOneAsync(r => r.Id == id, reservation);
        }

        public async Task DeleteAsync(string id)
        {
            await _reservations.DeleteOneAsync(r => r.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            return await _reservations.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            return await _reservations.CountDocumentsAsync(r => r.Status == status);
        }
    }
}
