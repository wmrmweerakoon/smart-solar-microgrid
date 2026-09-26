package com.smartsolar.microgrid.api.models;

public class MicrogridNodeDto {
    private String id;
    private String nodeName;
    private String location;
    private double capacity;
    private double latitude;
    private double longitude;
    private int batteryStorageSlots;
    private String status;

    public String getId() { return id; }
    public String getNodeName() { return nodeName; }
    public String getLocation() { return location; }
    public double getCapacity() { return capacity; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public int getBatteryStorageSlots() { return batteryStorageSlots; }
    public String getStatus() { return status; }

    @Override
    public String toString() {
        return nodeName + " (" + location + ")";
    }
}
