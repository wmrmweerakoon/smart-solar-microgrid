using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.API.Models
{
    [BsonIgnoreExtraElements]
    public class Prosumer
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("nic")]
        public string Nic { get; set; } = string.Empty;

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("email")]
        public string Email { get; set; } = string.Empty;

        [BsonElement("phone")]
        public string Phone { get; set; } = string.Empty;

        [BsonElement("address")]
        public string Address { get; set; } = string.Empty;

        [BsonElement("microgridNodeId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MicrogridNodeId { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "Pending"; // "Pending", "Active", "Inactive"

        [BsonElement("solarCapacity")]
        public double SolarCapacity { get; set; } // in kW

        [BsonElement("activatedBy")]
        public string ActivatedBy { get; set; } = string.Empty;

        [BsonElement("activatedAt")]
        public DateTime? ActivatedAt { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    // DTO for creating/updating a prosumer
    public class ProsumerDto
    {
        public string? Id { get; set; }
        public string Nic { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string MicrogridNodeId { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public double SolarCapacity { get; set; }
        public string ActivatedBy { get; set; } = string.Empty;
        public DateTime? ActivatedAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
