package com.smartsolar.microgrid.api.models;

import java.util.List;

public class DashboardStatsDto {
    private int totalProsumers;
    private int activeProsumers;
    private int totalMicrogridNodes;
    private int activeMicrogridNodes;
    private int totalEnergySlots;
    private int availableEnergySlots;
    private int totalReservations;
    private int pendingReservations;
    private int approvedFutureReservations;
    private int currentBookings;
    private int pendingBookings;
    private int completedBookings;
    private double totalEnergyTradedKWh;
    private double totalRevenueUSD;
    private List<BookingDto> recentBookings;

    public int getTotalProsumers() { return totalProsumers; }
    public int getActiveProsumers() { return activeProsumers; }
    public int getTotalMicrogridNodes() { return totalMicrogridNodes; }
    public int getActiveMicrogridNodes() { return activeMicrogridNodes; }
    public int getTotalEnergySlots() { return totalEnergySlots; }
    public int getAvailableEnergySlots() { return availableEnergySlots; }
    public int getTotalReservations() { return totalReservations; }
    public int getPendingReservations() { return pendingReservations; }
    public int getApprovedFutureReservations() { return approvedFutureReservations; }
    public int getCurrentBookings() { return currentBookings; }
    public int getPendingBookings() { return pendingBookings; }
    public int getCompletedBookings() { return completedBookings; }
    public double getTotalEnergyTradedKWh() { return totalEnergyTradedKWh; }
    public double getTotalRevenueUSD() { return totalRevenueUSD; }
    public List<BookingDto> getRecentBookings() { return recentBookings; }
}
