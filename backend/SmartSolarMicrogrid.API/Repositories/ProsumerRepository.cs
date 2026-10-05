/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * System Module Documentation
 * ==============================================================================
 */
using MongoDB.Bson;
using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for Prosumer data access operations using NIC as primary key.
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
            // Executes the GetAllAsync operation flow
            return await _prosumers.Find(_ => true).SortByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<Prosumer?> GetByNicAsync(string nic)
        {
            return await _prosumers.Find(p => p.Nic == nic).FirstOrDefaultAsync();
        }

        public async Task<Prosumer?> GetByIdAsync(string id)
        {
            return await GetByNicAsync(id);
        }

        public async Task<List<Prosumer>> GetByStatusAsync(string status)
        {
            // Executes the GetByStatusAsync operation flow
            return await _prosumers.Find(p => p.Status == status).SortByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task<List<Prosumer>> GetByMicrogridNodeIdAsync(string nodeId)
        {
            // Executes the GetByMicrogridNodeIdAsync operation flow
            return await _prosumers.Find(p => p.MicrogridNodeId == nodeId).ToListAsync();
        }

        public async Task<Prosumer?> GetByEmailAsync(string email)
        {
            return await _prosumers.Find(p => p.Email.ToLower() == email.ToLower()).FirstOrDefaultAsync();
        }

        public async Task<List<Prosumer>> SearchAsync(string? query, string? status, string? nodeId)
        {
            // Executes the SearchAsync operation flow
            var filterBuilder = Builders<Prosumer>.Filter;
            var filter = filterBuilder.Empty;

            if (!string.IsNullOrWhiteSpace(query))
            {
                var q = query.Trim();
                var regex = new BsonRegularExpression(q, "i");
                var queryFilter = filterBuilder.Or(
                    filterBuilder.Regex(p => p.Nic, regex),
                    filterBuilder.Regex(p => p.Name, regex),
                    filterBuilder.Regex(p => p.Email, regex),
                    filterBuilder.Regex(p => p.Phone, regex),
                    filterBuilder.Regex(p => p.Address, regex)
                );
                filter = filterBuilder.And(filter, queryFilter);
            }

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                filter = filterBuilder.And(filter, filterBuilder.Eq(p => p.Status, status));
            }

            if (!string.IsNullOrWhiteSpace(nodeId) && nodeId != "All")
            {
                filter = filterBuilder.And(filter, filterBuilder.Eq(p => p.MicrogridNodeId, nodeId));
            }

            return await _prosumers.Find(filter).SortByDescending(p => p.CreatedAt).ToListAsync();
        }

        public async Task CreateAsync(Prosumer prosumer)
        {
            // Executes the CreateAsync operation flow
            await _prosumers.InsertOneAsync(prosumer);
        }

        public async Task UpdateAsync(string nic, Prosumer prosumer)
        {
            // Executes the UpdateAsync operation flow
            await _prosumers.ReplaceOneAsync(p => p.Nic == nic, prosumer);
        }

        public async Task DeleteAsync(string nic)
        {
            // Executes the DeleteAsync operation flow
            await _prosumers.DeleteOneAsync(p => p.Nic == nic);
        }

        public async Task<long> GetCountAsync()
        {
            // Executes the GetCountAsync operation flow
            return await _prosumers.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            // Executes the GetCountByStatusAsync operation flow
            return await _prosumers.CountDocumentsAsync(p => p.Status == status);
        }
    }
}

