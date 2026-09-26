package com.smartsolar.microgrid.api.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

/**
 * BookingDto — DTO representing energy booking record with scheduling and party information.
 * Component: Member 3 (Nethum) — Booking Data Model
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class BookingDto implements Serializable {
    private String id;
    private String energySlotId;
    private String reservationId;

    private String microgridNodeId;
    private String microgridNodeName;
    private String microgridLocation;

    private String sellerProsumerId;
    private String sellerName;

    private String buyerProsumerId;
    private String buyerName;

    private double energyAmount;

    @SerializedName(value = "pricePerUnit", alternate = {"pricePerKWh"})
    private double pricePerUnit;

    private double totalPrice;

    private String slotDate;
    private String startTime;
    private String endTime;
    private String status;

    private String createdAt;
    private String updatedAt;
    private String notes;
    private String qrToken;

    public String getId() { return id; }
    public String getEnergySlotId() { return energySlotId; }
    public String getReservationId() { return reservationId; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public String getMicrogridNodeName() { return microgridNodeName != null ? microgridNodeName : "Grid Station"; }
    public String getMicrogridLocation() { return microgridLocation != null ? microgridLocation : ""; }
    public String getSellerProsumerId() { return sellerProsumerId; }
    public String getSellerName() { return sellerName != null ? sellerName : sellerProsumerId; }
    public String getBuyerProsumerId() { return buyerProsumerId; }
    public String getBuyerName() { return buyerName != null ? buyerName : buyerProsumerId; }
    public double getEnergyAmount() { return energyAmount; }
    public double getPricePerUnit() { return pricePerUnit; }
    public double getTotalPrice() { return totalPrice; }
    public String getSlotDate() { return slotDate; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public String getStatus() { return status != null ? status : "Booked"; }
    public String getCreatedAt() { return createdAt; }
    public String getUpdatedAt() { return updatedAt; }
    public String getNotes() { return notes; }
    public String getQrToken() { return qrToken; }
}
