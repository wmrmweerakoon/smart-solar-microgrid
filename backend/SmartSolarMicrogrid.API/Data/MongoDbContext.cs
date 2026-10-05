/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: MongoDbContext.cs
 * Purpose: Establishes and configures the connection to the MongoDB Atlas cluster.
 * ==============================================================================
 */
using MongoDB.Driver;
using SmartSolarMicrogrid.API.Models;

namespace SmartSolarMicrogrid.API.Data
{
    /// <summary>
    /// MongoDB database context providing typed collection access.
    /// </summary>
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(IConfiguration configuration)
        {
            var connectionString = configuration["MongoDbSettings:ConnectionString"];
            var databaseName = configuration["MongoDbSettings:DatabaseName"];

            var client = new MongoClient(connectionString);
            _database = client.GetDatabase(databaseName);
        }

        public IMongoCollection<User> Users => _database.GetCollection<User>("Users");
        public IMongoCollection<Prosumer> Prosumers => _database.GetCollection<Prosumer>("Prosumers");
        public IMongoCollection<MicrogridNode> MicrogridNodes => _database.GetCollection<MicrogridNode>("MicrogridNodes");
        public IMongoCollection<EnergySlot> EnergySlots => _database.GetCollection<EnergySlot>("EnergySlots");
        public IMongoCollection<Reservation> Reservations => _database.GetCollection<Reservation>("Reservations");
    }
}


