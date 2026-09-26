package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.BookingDetailsDto;
import com.smartsolar.microgrid.utils.NetworkUtils;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * BookingDetailsActivity — Comprehensive operational details view for a specific booking.
 * Displays energy volume, pricing, station location, seller/buyer contact info,
 * and enables instant QR token generation for physical station check-in.
 */
public class BookingDetailsActivity extends AppCompatActivity {

    private TextView tvBookingId, tvStatusBadge, tvEnergyAmount, tvTotalPrice, tvSchedule, tvStation, tvSellerDetails, tvBuyerDetails, tvNotes;
    private Button btnBack, btnGenerateQr;
    private ProgressBar progressBar;
    private String bookingId;
    private BookingDetailsDto currentBooking;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_details);

        bookingId = getIntent().getStringExtra("EXTRA_BOOKING_ID");
        if (bookingId == null) {
            Toast.makeText(this, "Booking ID missing", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        btnBack = findViewById(R.id.btnBack);
        btnGenerateQr = findViewById(R.id.btnGenerateQr);
        tvBookingId = findViewById(R.id.tvBookingId);
        tvStatusBadge = findViewById(R.id.tvStatusBadge);
        tvEnergyAmount = findViewById(R.id.tvEnergyAmount);
        tvTotalPrice = findViewById(R.id.tvTotalPrice);
        tvSchedule = findViewById(R.id.tvSchedule);
        tvStation = findViewById(R.id.tvStation);
        tvSellerDetails = findViewById(R.id.tvSellerDetails);
        tvBuyerDetails = findViewById(R.id.tvBuyerDetails);
        tvNotes = findViewById(R.id.tvNotes);
        progressBar = findViewById(R.id.progressBar);

        btnBack.setOnClickListener(v -> finish());

        // Phase 5 (Member 4): Open QR Code Generator
        btnGenerateQr.setOnClickListener(v -> {
            if (currentBooking != null) {
                Intent intent = new Intent(BookingDetailsActivity.this, QrGeneratorActivity.class);
                intent.putExtra("EXTRA_RESERVATION_ID", currentBooking.getId());
                intent.putExtra("EXTRA_BUYER_NIC", currentBooking.getBuyerProsumerId());
                intent.putExtra("EXTRA_ENERGY_AMOUNT", currentBooking.getEnergyAmount());
                intent.putExtra("EXTRA_TOTAL_PRICE", currentBooking.getTotalPrice());
                intent.putExtra("EXTRA_SLOT_DATE", currentBooking.getSlotDate());
                intent.putExtra("EXTRA_START_TIME", currentBooking.getStartTime());
                intent.putExtra("EXTRA_END_TIME", currentBooking.getEndTime());
                intent.putExtra("EXTRA_NODE_ID", currentBooking.getMicrogridNodeId());
                intent.putExtra("EXTRA_NODE_NAME", currentBooking.getMicrogridNodeName());
                startActivity(intent);
            } else {
                Toast.makeText(this, "Loading booking details...", Toast.LENGTH_SHORT).show();
            }
        });

        loadDetails();
    }

    private void loadDetails() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getBookingDetails(bookingId).enqueue(new Callback<BookingDetailsDto>() {
            @Override
            public void onResponse(Call<BookingDetailsDto> call, Response<BookingDetailsDto> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    currentBooking = response.body();
                    displayDetails(currentBooking);
                } else {
                    Toast.makeText(BookingDetailsActivity.this, "Could not load booking details", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<BookingDetailsDto> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(BookingDetailsActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void displayDetails(BookingDetailsDto b) {
        tvBookingId.setText("Ref #" + b.getId());
        tvStatusBadge.setText(b.getStatus().toUpperCase());
        tvEnergyAmount.setText(String.format(Locale.US, "%.1f kWh", b.getEnergyAmount()));
        tvTotalPrice.setText(String.format(Locale.US, "$%.2f", b.getTotalPrice()));

        String date = b.getSlotDate() != null ? b.getSlotDate().split("T")[0] : "Scheduled";
        tvSchedule.setText(String.format("📅 Delivery: %s (%s - %s)", date, b.getStartTime(), b.getEndTime()));
        tvStation.setText(String.format("Station: %s (%s)", b.getMicrogridNodeName(), b.getMicrogridLocation()));

        tvSellerDetails.setText(String.format("Seller: %s (%s)
Email: %s | Phone: %s",
                b.getSellerName(), b.getSellerProsumerId(), b.getSellerEmail(), b.getSellerPhone()));

        tvBuyerDetails.setText(String.format("Buyer: %s (%s)
Email: %s | Phone: %s",
                b.getBuyerName(), b.getBuyerProsumerId(), b.getBuyerEmail(), b.getBuyerPhone()));

        tvNotes.setText("Notes: " + (b.getNotes() != null && !b.getNotes().isEmpty() ? b.getNotes() : "Standard Microgrid Delivery"));
    }
}
