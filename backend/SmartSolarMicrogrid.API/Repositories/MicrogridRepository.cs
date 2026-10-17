/*
 * File: MicrogridRepository.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Data access layer for interacting with the Microgrid MongoDB collection.
 */

using MongoDB.Driver;
using SmartSolarMicrogrid.API.Data;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Repositories
{
    /// <summary>
    /// Repository for MicrogridNode data access operations.
    /// </summary>
    public class MicrogridRepository
    {
        private readonly IMongoCollection<MicrogridNode> _nodes;

        public MicrogridRepository(MongoDbContext context)
        {
            // Initializes the repository with database context
            _nodes = context.MicrogridNodes;
        }

        public async Task<List<MicrogridNode>> GetAllAsync()
        {
            // Retrieves all from the system
            return await _nodes.Find(_ => true).ToListAsync();
        }

        public async Task<MicrogridNode?> GetByIdAsync(string id)
        {
            return await _nodes.Find(n => n.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<MicrogridNode>> GetByStatusAsync(string status)
        {
            // Retrieves by status from the system
            return await _nodes.Find(n => n.Status == status).ToListAsync();
        }

        public async Task CreateAsync(MicrogridNode node)
        {
            // Adds a new  to the system
            await _nodes.InsertOneAsync(node);
        }

        public async Task UpdateAsync(string id, MicrogridNode node)
        {
            // Modifies the existing 
            await _nodes.ReplaceOneAsync(n => n.Id == id, node);
        }

        public async Task DeleteAsync(string id)
        {
            // Deletes the specified 
            await _nodes.DeleteOneAsync(n => n.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            // Retrieves count from the system
            return await _nodes.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            // Retrieves count by status from the system
            return await _nodes.CountDocumentsAsync(n => n.Status == status);
        }
    }
}
