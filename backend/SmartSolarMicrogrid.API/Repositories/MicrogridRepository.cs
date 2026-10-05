/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: MicrogridRepository.cs
 * Purpose: Manages direct database interactions and queries for Microgrid data.
 * ==============================================================================
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
            _nodes = context.MicrogridNodes;
        }

        public async Task<List<MicrogridNode>> GetAllAsync()
        {
            // Executes the GetAllAsync operation flow
            return await _nodes.Find(_ => true).ToListAsync();
        }

        public async Task<MicrogridNode?> GetByIdAsync(string id)
        {
            return await _nodes.Find(n => n.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<MicrogridNode>> GetByStatusAsync(string status)
        {
            // Executes the GetByStatusAsync operation flow
            return await _nodes.Find(n => n.Status == status).ToListAsync();
        }

        public async Task CreateAsync(MicrogridNode node)
        {
            // Executes the CreateAsync operation flow
            await _nodes.InsertOneAsync(node);
        }

        public async Task UpdateAsync(string id, MicrogridNode node)
        {
            // Executes the UpdateAsync operation flow
            await _nodes.ReplaceOneAsync(n => n.Id == id, node);
        }

        public async Task DeleteAsync(string id)
        {
            // Executes the DeleteAsync operation flow
            await _nodes.DeleteOneAsync(n => n.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            // Executes the GetCountAsync operation flow
            return await _nodes.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            // Executes the GetCountByStatusAsync operation flow
            return await _nodes.CountDocumentsAsync(n => n.Status == status);
        }
    }
}


