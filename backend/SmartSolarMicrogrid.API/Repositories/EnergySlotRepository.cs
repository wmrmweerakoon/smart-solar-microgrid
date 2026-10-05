/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * System Module Documentation
 * ==============================================================================
 */
using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for EnergySlot data access operations.
    /// </summary>
    public class EnergySlotRepository
    {
        private readonly IMongoCollection<EnergySlot> _slots;

        public EnergySlotRepository(MongoDbContext context)
        {
            _slots = context.EnergySlots;
        }

        public async Task<List<EnergySlot>> GetAllAsync()
        {
            // Executes the GetAllAsync operation flow
            return await _slots.Find(_ => true).ToListAsync();
        }

        public async Task<EnergySlot?> GetByIdAsync(string id)
        {
            return await _slots.Find(s => s.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<EnergySlot>> GetByStatusAsync(string status)
        {
            // Executes the GetByStatusAsync operation flow
            return await _slots.Find(s => s.Status == status).ToListAsync();
        }

        public async Task<List<EnergySlot>> GetByProsumerIdAsync(string prosumerId)
        {
            // Executes the GetByProsumerIdAsync operation flow
            return await _slots.Find(s => s.ProsumerId == prosumerId).ToListAsync();
        }

        public async Task<List<EnergySlot>> GetByMicrogridNodeIdAsync(string nodeId)
        {
            // Executes the GetByMicrogridNodeIdAsync operation flow
            return await _slots.Find(s => s.MicrogridNodeId == nodeId).ToListAsync();
        }

        public async Task CreateAsync(EnergySlot slot)
        {
            // Executes the CreateAsync operation flow
            await _slots.InsertOneAsync(slot);
        }

        public async Task UpdateAsync(string id, EnergySlot slot)
        {
            // Executes the UpdateAsync operation flow
            await _slots.ReplaceOneAsync(s => s.Id == id, slot);
        }

        public async Task DeleteAsync(string id)
        {
            // Executes the DeleteAsync operation flow
            await _slots.DeleteOneAsync(s => s.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            // Executes the GetCountAsync operation flow
            return await _slots.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            // Executes the GetCountByStatusAsync operation flow
            return await _slots.CountDocumentsAsync(s => s.Status == status);
        }
    }
}

