package com.smartsolar.microgrid.api.models;

/**
 * CreateReservationRequest — DTO payload for booking a new energy slot reservation.
 * Component: Member 2 (Dilani) — Reservation API Request
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class CreateReservationRequest {
    private String energySlotId;
    private String buyerProsumerId;
    private double energyAmount;
    private String notes;

    public CreateReservationRequest(String energySlotId, String buyerProsumerId, double energyAmount, String notes) {
        this.energySlotId = energySlotId;
        this.buyerProsumerId = buyerProsumerId;
        this.energyAmount = energyAmount;
        this.notes = notes;
    }

    public String getEnergySlotId() { return energySlotId; }
    public void setEnergySlotId(String energySlotId) { this.energySlotId = energySlotId; }

    public String getBuyerProsumerId() { return buyerProsumerId; }
    public void setBuyerProsumerId(String buyerProsumerId) { this.buyerProsumerId = buyerProsumerId; }

    public double getEnergyAmount() { return energyAmount; }
    public void setEnergyAmount(double energyAmount) { this.energyAmount = energyAmount; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
