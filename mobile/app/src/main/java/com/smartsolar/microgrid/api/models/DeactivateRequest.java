package com.smartsolar.microgrid.api.models;

public class DeactivateRequest {
    private String reason;

    public DeactivateRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
