/*
 * File: EnergySlot.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Data model representing EnergySlot entities within the system.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.API.Models
{
    [BsonIgnoreExtraElements]
    public class EnergySlot
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("microgridNodeId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MicrogridNodeId { get; set; } = string.Empty;

        [BsonElement("prosumerId")]
        public string ProsumerId { get; set; } = string.Empty; // Stored as NIC string

        [BsonElement("energyAmount")]
        public double EnergyAmount { get; set; } // in kWh

        [BsonElement("pricePerUnit")]
        public decimal PricePerUnit { get; set; } // price per kWh

        [BsonElement("slotDate")]
        public DateTime SlotDate { get; set; }

        [BsonElement("startTime")]
        public string StartTime { get; set; } = string.Empty; // e.g., "09:00"

        [BsonElement("endTime")]
        public string EndTime { get; set; } = string.Empty; // e.g., "10:00"

        [BsonElement("status")]
        public string Status { get; set; } = "Available"; // "Available", "Booked", "Completed", "Cancelled"

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    // DTO for creating/updating an energy slot
    public class EnergySlotDto
    {
        public string? Id { get; set; }
        public string MicrogridNodeId { get; set; } = string.Empty;
        public string ProsumerId { get; set; } = string.Empty;
        public double EnergyAmount { get; set; }
        public decimal PricePerUnit { get; set; }
        public DateTime SlotDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Status { get; set; } = "Available";
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
