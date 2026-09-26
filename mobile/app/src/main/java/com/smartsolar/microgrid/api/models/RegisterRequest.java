package com.smartsolar.microgrid.api.models;

public class RegisterRequest {
    private String nic;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String microgridNodeId;
    private double solarCapacity;
    private String password;

    public RegisterRequest(String nic, String name, String email, String phone, String address, String microgridNodeId, double solarCapacity, String password) {
        this.nic = nic;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.microgridNodeId = microgridNodeId;
        this.solarCapacity = solarCapacity;
        this.password = password;
    }

    public String getNic() { return nic; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public String getMicrogridNodeId() { return microgridNodeId; }
    public double getSolarCapacity() { return solarCapacity; }
    public String getPassword() { return password; }
}
