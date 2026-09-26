package com.smartsolar.microgrid.api.models;

public class ReservationDto {
    private String id;
    private String energySlotId;
    private String buyerProsumerId;
    private String sellerProsumerId;
    private String microgridNodeId;
    private double energyAmount;
    private double totalPrice;
    private String status;
    private String reservedAt;
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
    public String getNotes() { return notes; }
}
