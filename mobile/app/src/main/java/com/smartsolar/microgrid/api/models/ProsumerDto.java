package com.smartsolar.microgrid.api.models;

/**
 * ProsumerDto — DTO representing prosumer profile with NIC primary key and address.
 * Component: Member 1 (Ruvishan) — Prosumer Data Model
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ProsumerDto {
    private String nic;
    private String id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String microgridNodeId;
    private String status;
    private double solarCapacity;
    private String activatedBy;
    private String activatedAt;
    private String createdAt;

    public String getNic() { return nic != null ? nic : id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public String getStatus() { return status; }
    public double getSolarCapacity() { return solarCapacity; }
    public String getActivatedBy() { return activatedBy; }
    public String getActivatedAt() { return activatedAt; }
    public String getCreatedAt() { return createdAt; }
}
