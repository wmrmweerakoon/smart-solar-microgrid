package com.smartsolar.microgrid.api.models;

import java.io.Serializable;
import java.util.List;

public class DashboardStatsDto implements Serializable {
    private long totalProsumers;
    private long pendingProsumers;
    private long activeProsumers;

    private long totalNodes;
    private long activeNodes;

    private long totalEnergySlots;
    private long availableSlots;

    private long currentBookings;
    private long pendingBookings;
    private long completedBookings;

    private long totalReservations;
    private long pendingReservations;
    private long approvedFutureReservations;

    private double totalEnergyTradedKWh;
    private double totalRevenueTraded;
    private List<BookingDto> recentBookings;

    public long getTotalProsumers() { return totalProsumers; }
    public long getPendingProsumers() { return pendingProsumers; }
    public long getActiveProsumers() { return activeProsumers; }
    public long getTotalNodes() { return totalNodes; }
    public long getActiveNodes() { return activeNodes; }
    public long getTotalEnergySlots() { return totalEnergySlots; }
    public long getAvailableSlots() { return availableSlots; }
    public long getCurrentBookings() { return currentBookings; }
    public long getPendingBookings() { return pendingBookings; }
    public long getCompletedBookings() { return completedBookings; }
    public long getTotalReservations() { return totalReservations; }
    public long getPendingReservations() { return pendingReservations; }
    public long getApprovedFutureReservations() { return approvedFutureReservations; }
    public double getTotalEnergyTradedKWh() { return totalEnergyTradedKWh; }
    public double getTotalRevenueTraded() { return totalRevenueTraded; }
    public List<BookingDto> getRecentBookings() { return recentBookings; }
}
