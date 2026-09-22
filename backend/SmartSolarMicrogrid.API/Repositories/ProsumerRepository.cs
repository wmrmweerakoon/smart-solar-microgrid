using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for Prosumer data access operations.
    /// </summary>
    public class ProsumerRepository
    {
        private readonly IMongoCollection<Prosumer> _prosumers;

        public ProsumerRepository(MongoDbContext context)
        {
            _prosumers = context.Prosumers;
        }

        public async Task<List<Prosumer>> GetAllAsync()
        {
            return await _prosumers.Find(_ => true).ToListAsync();
        }

        public async Task<Prosumer?> GetByIdAsync(string id)
        {
            return await _prosumers.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<Prosumer>> GetByStatusAsync(string status)
        {
            return await _prosumers.Find(p => p.Status == status).ToListAsync();
        }

        public async Task<List<Prosumer>> GetByMicrogridNodeIdAsync(string nodeId)
        {
            return await _prosumers.Find(p => p.MicrogridNodeId == nodeId).ToListAsync();
        }

        public async Task<Prosumer?> GetByEmailAsync(string email)
        {
            return await _prosumers.Find(p => p.Email == email).FirstOrDefaultAsync();
        }

        public async Task CreateAsync(Prosumer prosumer)
        {
            await _prosumers.InsertOneAsync(prosumer);
        }

        public async Task UpdateAsync(string id, Prosumer prosumer)
        {
            await _prosumers.ReplaceOneAsync(p => p.Id == id, prosumer);
        }

        public async Task DeleteAsync(string id)
        {
            await _prosumers.DeleteOneAsync(p => p.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            return await _prosumers.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            return await _prosumers.CountDocumentsAsync(p => p.Status == status);
        }
    }
}
