/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: MicrogridNode.cs
 * Purpose: Data model / Schema definition representing MicrogridNode.
 * ==============================================================================
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.API.Models
{
    public class NodeSchedule
    {
        public string DayOfWeek { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
    }

    [BsonIgnoreExtraElements]
    public class MicrogridNode
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("nodeName")]
        public string NodeName { get; set; } = string.Empty;

        [BsonElement("location")]
        public string Location { get; set; } = string.Empty;

        [BsonElement("capacity")]
        public double Capacity { get; set; } // in kW

        [BsonElement("currentLoad")]
        public double CurrentLoad { get; set; } // in kW

        [BsonElement("status")]
        public string Status { get; set; } = "Active"; // "Active", "Inactive", "Maintenance"

        [BsonElement("latitude")]
        public double Latitude { get; set; }

        [BsonElement("longitude")]
        public double Longitude { get; set; }

        [BsonElement("batteryStorageSlots")]
        public int BatteryStorageSlots { get; set; }

        [BsonElement("schedules")]
        public List<NodeSchedule> Schedules { get; set; } = new List<NodeSchedule>();

        [BsonElement("createdBy")]
        public string CreatedBy { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    // DTO for creating/updating a microgrid node
    public class MicrogridNodeDto
    {
        public string? Id { get; set; }
        public string NodeName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public double Capacity { get; set; }
        public double CurrentLoad { get; set; }
        public string Status { get; set; } = "Active";
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int BatteryStorageSlots { get; set; }
        public List<NodeSchedule> Schedules { get; set; } = new List<NodeSchedule>();
        public string CreatedBy { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}


