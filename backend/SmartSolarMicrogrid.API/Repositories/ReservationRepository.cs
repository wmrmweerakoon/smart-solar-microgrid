/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: ReservationRepository.cs
 * Purpose: Manages direct database interactions and queries for Reservation data.
 * ==============================================================================
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
            _reservations = context.Reservations;
        }

        public async Task<List<Reservation>> GetAllAsync()
        {
            // Executes the GetAllAsync operation flow
            return await _reservations.Find(_ => true).ToListAsync();
        }

        public async Task<Reservation?> GetByIdAsync(string id)
        {
            return await _reservations.Find(r => r.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<Reservation>> GetByStatusAsync(string status)
        {
            // Executes the GetByStatusAsync operation flow
            return await _reservations.Find(r => r.Status == status).ToListAsync();
        }

        public async Task<List<Reservation>> GetByBuyerIdAsync(string buyerId)
        {
            // Executes the GetByBuyerIdAsync operation flow
            return await _reservations.Find(r => r.BuyerProsumerId == buyerId).ToListAsync();
        }

        public async Task<List<Reservation>> GetBySellerIdAsync(string sellerId)
        {
            // Executes the GetBySellerIdAsync operation flow
            return await _reservations.Find(r => r.SellerProsumerId == sellerId).ToListAsync();
        }

        public async Task<List<Reservation>> GetByEnergySlotIdAsync(string slotId)
        {
            // Executes the GetByEnergySlotIdAsync operation flow
            return await _reservations.Find(r => r.EnergySlotId == slotId).ToListAsync();
        }

        public async Task<List<Reservation>> GetActiveReservationsByNodeIdAsync(string nodeId)
        {
            // Executes the GetActiveReservationsByNodeIdAsync operation flow
            return await _reservations.Find(r => r.MicrogridNodeId == nodeId && (r.Status == "Pending" || r.Status == "Confirmed")).ToListAsync();
        }

        public async Task<List<Reservation>> GetActiveReservationsByProsumerIdAsync(string prosumerId)
        {
            // Executes the GetActiveReservationsByProsumerIdAsync operation flow
            return await _reservations.Find(r => (r.BuyerProsumerId == prosumerId || r.SellerProsumerId == prosumerId) && (r.Status == "Pending" || r.Status == "Confirmed")).ToListAsync();
        }

        public async Task<List<Reservation>> GetReservationsByProsumerIdAsync(string prosumerId)
        {
            // Executes the GetReservationsByProsumerIdAsync operation flow
            return await _reservations.Find(r => r.BuyerProsumerId == prosumerId || r.SellerProsumerId == prosumerId).SortByDescending(r => r.ReservedAt).ToListAsync();
        }

        public async Task CreateAsync(Reservation reservation)
        {
            // Executes the CreateAsync operation flow
            await _reservations.InsertOneAsync(reservation);
        }

        public async Task UpdateAsync(string id, Reservation reservation)
        {
            // Executes the UpdateAsync operation flow
            await _reservations.ReplaceOneAsync(r => r.Id == id, reservation);
        }

        public async Task DeleteAsync(string id)
        {
            // Executes the DeleteAsync operation flow
            await _reservations.DeleteOneAsync(r => r.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            // Executes the GetCountAsync operation flow
            return await _reservations.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            // Executes the GetCountByStatusAsync operation flow
            return await _reservations.CountDocumentsAsync(r => r.Status == status);
        }
    }
}


