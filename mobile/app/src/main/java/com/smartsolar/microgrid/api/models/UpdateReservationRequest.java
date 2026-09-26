package com.smartsolar.microgrid.api.models;

public class UpdateReservationRequest {
    private double energyAmount;
    private String notes;

    public UpdateReservationRequest(double energyAmount, String notes) {
        this.energyAmount = energyAmount;
        this.notes = notes;
    }

    public double getEnergyAmount() { return energyAmount; }
    public void setEnergyAmount(double energyAmount) { this.energyAmount = energyAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
