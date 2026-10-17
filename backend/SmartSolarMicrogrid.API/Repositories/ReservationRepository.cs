/*
 * File: ReservationRepository.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Data access layer for interacting with the Reservation MongoDB collection.
 */

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
            // Initializes the repository with database context
            _reservations = context.Reservations;
        }

        public async Task<List<Reservation>> GetAllAsync()
        {
            // Retrieves all from the system
            return await _reservations.Find(_ => true).ToListAsync();
        }

        public async Task<Reservation?> GetByIdAsync(string id)
        {
            return await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<Reservation>> GetByStatusAsync(string status)
        {
            // Retrieves by status from the system
            return await _reservations.Find(r => r.Status == status).ToListAsync();
        }

        public async Task<List<Reservation>> GetByBuyerIdAsync(string buyerId)
        {
            // Retrieves by buyer id from the system
            return await _reservations.Find(r => r.BuyerProsumerId == buyerId).ToListAsync();
        }

        public async Task<List<Reservation>> GetBySellerIdAsync(string sellerId)
        {
            // Retrieves by seller id from the system
            return await _reservations.Find(r => r.SellerProsumerId == sellerId).ToListAsync();
        }

        public async Task<List<Reservation>> GetByEnergySlotIdAsync(string slotId)
        {
            // Retrieves by energy slot id from the system
            return await _reservations.Find(r => r.EnergySlotId == slotId).ToListAsync();
        }

        public async Task<List<Reservation>> GetActiveReservationsByNodeIdAsync(string nodeId)
        {
            // Retrieves active reservations by node id from the system
            return await _reservations.Find(r => r.MicrogridNodeId == nodeId && (r.Status == "Pending" || r.Status == "Confirmed")).ToListAsync();
        }

        public async Task<List<Reservation>> GetActiveReservationsByProsumerIdAsync(string prosumerId)
        {
            // Retrieves active reservations by prosumer id from the system
            return await _reservations.Find(r => (r.BuyerProsumerId == prosumerId || r.SellerProsumerId == prosumerId) && (r.Status == "Pending" || r.Status == "Confirmed")).ToListAsync();
        }

        public async Task<List<Reservation>> GetReservationsByProsumerIdAsync(string prosumerId)
        {
            // Retrieves reservations by prosumer id from the system
            return await _reservations.Find(r => r.BuyerProsumerId == prosumerId || r.SellerProsumerId == prosumerId).SortByDescending(r => r.ReservedAt).ToListAsync();
        }

        public async Task CreateAsync(Reservation reservation)
        {
            // Adds a new  to the system
            await _reservations.InsertOneAsync(reservation);
        }

        public async Task UpdateAsync(string id, Reservation reservation)
        {
            // Modifies the existing 
            await _reservations.ReplaceOneAsync(r => r.Id == id, reservation);
        }

        public async Task DeleteAsync(string id)
        {
            // Deletes the specified 
            await _reservations.DeleteOneAsync(r => r.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            // Retrieves count from the system
            return await _reservations.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            // Retrieves count by status from the system
            return await _reservations.CountDocumentsAsync(r => r.Status == status);
        }
    }
}
