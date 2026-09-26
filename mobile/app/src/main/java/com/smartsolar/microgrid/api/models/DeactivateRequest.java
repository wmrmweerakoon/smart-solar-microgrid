package com.smartsolar.microgrid.api.models;

/**
 * DeactivateRequest — DTO containing deactivation reason code and prosumer remarks.
 * Component: Member 1 (Ruvishan) — Account Deactivation Model
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class DeactivateRequest {
    private String reason;

    public DeactivateRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
