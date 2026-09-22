using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartSolarMicrogrid.API.Models
{
    public class Reservation
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("energySlotId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string EnergySlotId { get; set; } = string.Empty;

        [BsonElement("buyerProsumerId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string BuyerProsumerId { get; set; } = string.Empty;

        [BsonElement("sellerProsumerId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string SellerProsumerId { get; set; } = string.Empty;

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

    // DTO for creating/updating a reservation
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
}
