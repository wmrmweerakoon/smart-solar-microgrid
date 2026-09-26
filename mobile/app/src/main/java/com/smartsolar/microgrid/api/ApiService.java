package com.smartsolar.microgrid.api;

import com.smartsolar.microgrid.api.models.*;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

/**
 * ApiService — Central Retrofit 2 interface for Smart Solar Microgrid REST API.
 * Defines communication contracts for prosumers, energy slots, bookings, reservations,
 * microgrid nodes, telemetry dashboards, and transaction verification.
 */
public interface ApiService {

    // ── Auth Endpoints ──
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);

    @POST("auth/prosumer/register")
    Call<ProsumerDto> registerProsumer(@Body RegisterRequest request);

    // ── Prosumer Endpoints ──
    @GET("prosumer/{nic}")
    Call<ProsumerDto> getProsumerByNic(@Path("nic") String nic);

    @PUT("prosumer/{nic}")
    Call<ProsumerDto> updateProsumer(@Path("nic") String nic, @Body UpdateProsumerRequest body);

    @PUT("prosumer/{nic}/deactivate")
    Call<ResponseBody> deactivateProsumer(@Path("nic") String nic, @Body DeactivateRequest body);

    // ── Microgrid Nodes (Phase 5 - Member 4) ──
    @GET("microgrid")
    Call<List<MicrogridNodeDto>> getAllNodes();

    @GET("microgrid/{id}")
    Call<MicrogridNodeDto> getNodeById(@Path("id") String id);

    // ── Energy Slots ──
    @GET("energyslot")
    Call<List<EnergySlotDto>> getAllSlots();

    @GET("energyslot/status/{status}")
    Call<List<EnergySlotDto>> getSlotsByStatus(@Path("status") String status);

    @GET("energyslot/prosumer/{prosumerId}")
    Call<List<EnergySlotDto>> getSlotsByProsumer(@Path("prosumerId") String prosumerId);

    // ── Reservations (Phase 3 & 5) ──
    @GET("reservation")
    Call<List<ReservationDto>> getAllReservations();

    @GET("reservation/{id}")
    Call<ReservationDto> getReservationById(@Path("id") String id);

    @GET("reservation/{id}/details")
    Call<ReservationDetailsDto> getReservationDetails(@Path("id") String id);

    @GET("reservation/status/{status}")
    Call<List<ReservationDto>> getReservationsByStatus(@Path("status") String status);

    @POST("reservation")
    Call<ReservationDto> createReservation(@Body CreateReservationRequest request);

    @PUT("reservation/{id}")
    Call<ReservationDto> updateReservation(@Path("id") String id, @Body UpdateReservationRequest request);

    @PUT("reservation/{id}/cancel")
    Call<ResponseBody> cancelReservation(@Path("id") String id);

    @PUT("reservation/{id}/complete")
    Call<ResponseBody> completeReservation(@Path("id") String id);

    // ── Bookings (Phase 4 & 5) ──
    @GET("booking/current")
    Call<List<BookingDto>> getCurrentBookings();

    @GET("booking/pending")
    Call<List<BookingDto>> getPendingBookings();

    @GET("booking/history")
    Call<List<BookingDto>> getBookingHistory();

    @GET("booking/search")
    Call<List<BookingDto>> searchBookings(
        @Query("query") String query,
        @Query("status") String status,
        @Query("nodeId") String nodeId,
        @Query("prosumerId") String prosumerId
    );

    @GET("booking/{id}/details")
    Call<BookingDetailsDto> getBookingDetails(@Path("id") String id);

    @PUT("booking/{id}/confirm")
    Call<ResponseBody> confirmBooking(@Path("id") String id);

    @PUT("booking/{id}/complete")
    Call<ResponseBody> completeBooking(@Path("id") String id);

    // ── Dashboard ──
    @GET("dashboard/stats")
    Call<DashboardStatsDto> getDashboardStats();
}
