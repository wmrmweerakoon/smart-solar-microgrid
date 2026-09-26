package com.smartsolar.microgrid.api.models;

public class EnergySlotDto {
    private String id;
    private String microgridNodeId;
    private String prosumerId;
    private String slotDate;
    private String startTime;
    private String endTime;
    private double energyAmount;
    private double pricePerKWh;
    private String status;

    public String getId() { return id; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public String getProsumerId() { return prosumerId; }
    public String getSlotDate() { return slotDate; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public double getEnergyAmount() { return energyAmount; }
    public double getPricePerKWh() { return pricePerKWh; }
    public String getStatus() { return status; }
}
