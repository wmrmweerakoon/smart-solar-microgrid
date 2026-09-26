package com.smartsolar.microgrid.api;

import com.smartsolar.microgrid.api.models.*;
import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.*;

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

    // ── Microgrid Nodes ──
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

    // ── Reservations ──
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

    // ── Bookings ──
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

    @PUT("booking/{id}/confirm")
    Call<ResponseBody> confirmBooking(@Path("id") String id);

    @PUT("booking/{id}/complete")
    Call<ResponseBody> completeBooking(@Path("id") String id);

    // ── Dashboard ──
    @GET("dashboard/stats")
    Call<DashboardStatsDto> getDashboardStats();
}
