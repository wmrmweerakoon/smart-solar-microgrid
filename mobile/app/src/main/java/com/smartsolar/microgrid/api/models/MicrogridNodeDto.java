package com.smartsolar.microgrid.api.models;

import java.io.Serializable;

/**
 * MicrogridNodeDto — Data Transfer Object representing a microgrid station/node.
 * Used for Google Maps plotting, station telemetry, and local SQLite caching.
 * Member 4 contribution: Includes location coordinates and live distance calculation.
 */
public class MicrogridNodeDto implements Serializable {
    private String id;
    private String nodeName;
    private String location;
    private double capacity;
    private double currentLoad;
    private double latitude;
    private double longitude;
    private int batteryStorageSlots;
    private String status;
    private double distanceKm = -1; // Calculated dynamically from user's GPS coordinates

    public MicrogridNodeDto() {
    }

    public MicrogridNodeDto(String id, String nodeName, String location, double capacity,
                            double latitude, double longitude, int batteryStorageSlots, String status) {
        this.id = id;
        this.nodeName = nodeName;
        this.location = location;
        this.capacity = capacity;
        this.latitude = latitude;
        this.longitude = longitude;
        this.batteryStorageSlots = batteryStorageSlots;
        this.status = status;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getNodeName() { return nodeName; }
    public void setNodeName(String nodeName) { this.nodeName = nodeName; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public double getCapacity() { return capacity; }
    public void setCapacity(double capacity) { this.capacity = capacity; }

    public double getCurrentLoad() { return currentLoad; }
    public void setCurrentLoad(double currentLoad) { this.currentLoad = currentLoad; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public int getBatteryStorageSlots() { return batteryStorageSlots; }
    public void setBatteryStorageSlots(int batteryStorageSlots) { this.batteryStorageSlots = batteryStorageSlots; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    @Override
    public String toString() {
        return nodeName + " (" + location + ")";
    }
}
