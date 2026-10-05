/* 
 * ==============================================================================
 * Smart Solar Microgrid Trading & Energy Management System
 * File: Prosumer.cs
 * Purpose: Data model / Schema definition representing Prosumer.
 * ==============================================================================
 */
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.API.Models
{
    /// <summary>
    /// Solar prosumer entity using NIC as primary key with BSON schema resilience.
    /// </summary>
    [BsonIgnoreExtraElements]
    public class Prosumer
    {
        [BsonId]
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
        public string MicrogridNodeId { get; set; } = string.Empty;

        [BsonElement("status")]
        public string Status { get; set; } = "Pending"; // "Pending", "Active", "Inactive"

        [BsonElement("solarCapacity")]
        public double SolarCapacity { get; set; } // in kW

        [BsonElement("passwordHash")]
        public string PasswordHash { get; set; } = string.Empty;

        [BsonElement("activatedBy")]
        public string ActivatedBy { get; set; } = string.Empty;

        [BsonElement("activatedAt")]
        public DateTime? ActivatedAt { get; set; }

        [BsonElement("deactivatedAt")]
        public DateTime? DeactivatedAt { get; set; }

        [BsonElement("deactivationReason")]
        public string DeactivationReason { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// DTO for returning Prosumer information.
    /// Includes both Nic and Id alias for seamless client compatibility.
    /// </summary>
    public class ProsumerDto
    {
        public string Nic { get; set; } = string.Empty;
        public string Id => Nic; // Alias for backward compatibility
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string MicrogridNodeId { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public double SolarCapacity { get; set; }
        public string ActivatedBy { get; set; } = string.Empty;
        public DateTime? ActivatedAt { get; set; }
        public DateTime? DeactivatedAt { get; set; }
        public string DeactivationReason { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    /// <summary>
    /// DTO for creating a new prosumer profile.
    /// </summary>
    public class CreateProsumerDto
    {
        public string Nic { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string MicrogridNodeId { get; set; } = string.Empty;
        public double SolarCapacity { get; set; }
    }

    /// <summary>
    /// DTO for prosumer self-registration from mobile app.
    /// </summary>
    public class RegisterProsumerDto
    {
        public string Nic { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string MicrogridNodeId { get; set; } = string.Empty;
        public double SolarCapacity { get; set; }
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for updating an existing prosumer profile.
    /// </summary>
    public class UpdateProsumerDto
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string MicrogridNodeId { get; set; } = string.Empty;
        public double SolarCapacity { get; set; }
        public string? Status { get; set; }
    }

    /// <summary>
    /// DTO for prosumer deactivation.
    /// </summary>
    public class DeactivateProsumerDto
    {
        public string Reason { get; set; } = string.Empty;
    }

    /// <summary>
    /// Detailed DTO with associated reservations and node information.
    /// </summary>
    public class ProsumerDetailsDto : ProsumerDto
    {
        public string MicrogridNodeName { get; set; } = string.Empty;
        public string MicrogridLocation { get; set; } = string.Empty;
        public int TotalReservationsCount { get; set; }
        public int ActiveReservationsCount { get; set; }
        public List<ReservationDto> RecentReservations { get; set; } = new List<ReservationDto>();
    }
}


