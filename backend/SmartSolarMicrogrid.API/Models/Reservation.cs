/*
 * File: Reservation.cs
 * Module: SE4040 Enterprise Application Development
 * Description: Data model representing Reservation entities within the system.
 */

using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.API.Models
{
    [BsonIgnoreExtraElements]
    public class Reservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("energySlotId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string EnergySlotId { get; set; } = string.Empty;

        [BsonElement("buyerProsumerId")]
        public string BuyerProsumerId { get; set; } = string.Empty; // Stored as NIC string

        [BsonElement("sellerProsumerId")]
        public string SellerProsumerId { get; set; } = string.Empty; // Stored as NIC string

        [BsonElement("microgridNodeId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string MicrogridNodeId { get; set; } = string.Empty;

        [BsonElement("energyAmount")]
        public double EnergyAmount { get; set; } // in kWh

        [BsonElement("totalPrice")]
        public decimal TotalPrice { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "Pending"; // "Pending", "Confirmed", "Cancelled", "Completed"

        [BsonElement("reservedAt")]
        public DateTime ReservedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("updatedAt")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("notes")]
        public string Notes { get; set; } = string.Empty;
    }

    // Standard DTO for reading/transferring a reservation
    public class ReservationDto
    {
        public string? Id { get; set; }
        public string EnergySlotId { get; set; } = string.Empty;
        public string BuyerProsumerId { get; set; } = string.Empty;
        public string SellerProsumerId { get; set; } = string.Empty;
        public string MicrogridNodeId { get; set; } = string.Empty;
        public double EnergyAmount { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime ReservedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    // Request payload for creating a reservation
    public class CreateReservationRequest
    {
        public string EnergySlotId { get; set; } = string.Empty;
        public string BuyerProsumerId { get; set; } = string.Empty;
        public double EnergyAmount { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    // Request payload for updating an existing reservation
    public class UpdateReservationRequest
    {
        public double EnergyAmount { get; set; }
        public string Notes { get; set; } = string.Empty;
    }

    // Detailed DTO enriched with Prosumer, Node, and Slot information
    public class ReservationDetailsDto : ReservationDto
    {
        public string BuyerName { get; set; } = string.Empty;
        public string BuyerEmail { get; set; } = string.Empty;
        public string BuyerPhone { get; set; } = string.Empty;

        public string SellerName { get; set; } = string.Empty;
        public string SellerEmail { get; set; } = string.Empty;
        public string SellerPhone { get; set; } = string.Empty;

        public string MicrogridNodeName { get; set; } = string.Empty;
        public string MicrogridLocation { get; set; } = string.Empty;

        public DateTime SlotDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public decimal PricePerUnit { get; set; }

        public bool CanModifyOrCancel { get; set; }
        public double HoursUntilSlot { get; set; }
    }
}
