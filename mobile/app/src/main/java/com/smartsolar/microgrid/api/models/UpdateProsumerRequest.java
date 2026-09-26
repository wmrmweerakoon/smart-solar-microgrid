package com.smartsolar.microgrid.api.models;

public class UpdateProsumerRequest {
    private String name;
    private String email;
    private String phone;
    private String address;
    private String microgridNodeId;
    private double solarCapacity;

    public UpdateProsumerRequest(String name, String email, String phone, String address, String microgridNodeId, double solarCapacity) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.microgridNodeId = microgridNodeId;
        this.solarCapacity = solarCapacity;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getMicrogridNodeId() { return microgridNodeId; }
    public void setMicrogridNodeId(String microgridNodeId) { this.microgridNodeId = microgridNodeId; }

    public double getSolarCapacity() { return solarCapacity; }
    public void setSolarCapacity(double solarCapacity) { this.solarCapacity = solarCapacity; }
}
