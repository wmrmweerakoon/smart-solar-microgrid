package com.smartsolar.microgrid.api.models;

public class BookingDto {
    private String id;
    private String reservationId;
    private String energySlotId;
    private String buyerProsumerId;
    private String sellerProsumerId;
    private String microgridNodeId;
    private double energyAmount;
    private double totalPrice;
    private String status;
    private String bookedAt;
    private String qrToken;

    public String getId() { return id; }
    public String getReservationId() { return reservationId; }
    public String getEnergySlotId() { return energySlotId; }
    public String getBuyerProsumerId() { return buyerProsumerId; }
    public String getSellerProsumerId() { return sellerProsumerId; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public double getEnergyAmount() { return energyAmount; }
    public double getTotalPrice() { return totalPrice; }
    public String getStatus() { return status; }
    public String getBookedAt() { return bookedAt; }
    public String getQrToken() { return qrToken; }
}
