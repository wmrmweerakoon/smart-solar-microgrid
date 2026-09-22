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
            return await _nodes.Find(_ => true).ToListAsync();
        }

        public async Task<MicrogridNode?> GetByIdAsync(string id)
        {
            return await _nodes.Find(n => n.Id == id).FirstOrDefaultAsync();
        }

        public async Task<List<MicrogridNode>> GetByStatusAsync(string status)
        {
            return await _nodes.Find(n => n.Status == status).ToListAsync();
        }

        public async Task CreateAsync(MicrogridNode node)
        {
            await _nodes.InsertOneAsync(node);
        }

        public async Task UpdateAsync(string id, MicrogridNode node)
        {
            await _nodes.ReplaceOneAsync(n => n.Id == id, node);
        }

        public async Task DeleteAsync(string id)
        {
            await _nodes.DeleteOneAsync(n => n.Id == id);
        }

        public async Task<long> GetCountAsync()
        {
            return await _nodes.CountDocumentsAsync(_ => true);
        }

        public async Task<long> GetCountByStatusAsync(string status)
        {
            return await _nodes.CountDocumentsAsync(n => n.Status == status);
        }
    }
}
