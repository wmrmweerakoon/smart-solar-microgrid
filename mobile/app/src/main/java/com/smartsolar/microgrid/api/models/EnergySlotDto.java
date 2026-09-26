package com.smartsolar.microgrid.api.models;

import com.google.gson.annotations.SerializedName;
import java.io.Serializable;

public class EnergySlotDto implements Serializable {
    private String id;
    private String microgridNodeId;
    private String prosumerId;
    private String slotDate;
    private String startTime;
    private String endTime;
    private double energyAmount;

    @SerializedName(value = "pricePerUnit", alternate = {"pricePerKWh"})
    private double pricePerUnit;

    private String status;

    public String getId() { return id; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public String getProsumerId() { return prosumerId; }
    public String getSlotDate() { return slotDate; }
    public String getStartTime() { return startTime; }
    public String getEndTime() { return endTime; }
    public double getEnergyAmount() { return energyAmount; }
    public double getPricePerUnit() { return pricePerUnit; }
    public double getPricePerKWh() { return pricePerUnit; }
    public String getStatus() { return status; }
}
