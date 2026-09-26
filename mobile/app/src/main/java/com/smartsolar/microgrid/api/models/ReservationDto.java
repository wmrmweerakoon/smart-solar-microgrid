package com.smartsolar.microgrid.api.models;

import java.io.Serializable;

/**
 * ReservationDto — DTO representing basic energy reservation data transfer object.
 * Component: Member 2 (Dilani) — Reservation Model
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ReservationDto implements Serializable {
    private String id;
    private String energySlotId;
    private String buyerProsumerId;
    private String sellerProsumerId;
    private String microgridNodeId;
    private double energyAmount;
    private double totalPrice;
    private String status;
    private String reservedAt;
    private String updatedAt;
    private String notes;

    public String getId() { return id; }
    public String getEnergySlotId() { return energySlotId; }
    public String getBuyerProsumerId() { return buyerProsumerId; }
    public String getSellerProsumerId() { return sellerProsumerId; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public double getEnergyAmount() { return energyAmount; }
    public double getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
    public String getReservedAt() { return reservedAt; }
    public String getUpdatedAt() { return updatedAt; }
    public String getNotes() { return notes; }
}
