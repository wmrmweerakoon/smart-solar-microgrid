package com.smartsolar.microgrid.api.models;

import java.io.Serializable;

public class ReservationDetailsDto implements Serializable {
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

    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;

    private String sellerName;
    private String sellerEmail;
    private String sellerPhone;

    private String microgridNodeName;
    private String microgridLocation;

    private String slotDate;
    private String startTime;
    private String endTime;
    private double pricePerUnit;

    private boolean canModifyOrCancel;
    private double hoursUntilSlot;

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

    public String getBuyerName() { return buyerName; }
    public String getBuyerEmail() { return buyerEmail; }
    public String getBuyerPhone() { return buyerPhone; }

    public String getSellerName() { return sellerName; }
    public String getSellerEmail() { return sellerEmail; }
    public String getSellerPhone() { return sellerPhone; }

    public String getMicrogridNodeName() { return microgridNodeName; }
    public String getMicrogridLocation() { return microgridLocation; }

    public String getSlotDate() { return slotDate; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public double getPricePerUnit() { return pricePerUnit; }

    public boolean isCanModifyOrCancel() { return canModifyOrCancel; }
    public double getHoursUntilSlot() { return hoursUntilSlot; }
}
