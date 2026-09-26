package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.ReservationDetailsDto;
import com.smartsolar.microgrid.api.models.ReservationDto;
import com.smartsolar.microgrid.utils.NetworkUtils;
import okhttp3.ResponseBody;
import org.json.JSONObject;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * CancelReservationActivity — Reservation cancellation workflow with advance notice check and confirmation.
 * Component: Member 2 (Dilani) — Cancel Reservation Workflow
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class CancelReservationActivity extends AppCompatActivity {

    private TextView tvReservationId, tvDetails, tvNoticeText;
    private Button btnConfirmCancel, btnKeepReservation;
    private ProgressBar progressBar;

    private String reservationId;
    private ReservationDetailsDto details;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cancel_reservation);

        reservationId = getIntent().getStringExtra("EXTRA_RESERVATION_ID");
        if (reservationId == null) {
            Toast.makeText(this, "Reservation ID missing", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        tvReservationId = findViewById(R.id.tvReservationId);
        tvDetails = findViewById(R.id.tvDetails);
        tvNoticeText = findViewById(R.id.tvNoticeText);
        btnConfirmCancel = findViewById(R.id.btnConfirmCancel);
        btnKeepReservation = findViewById(R.id.btnKeepReservation);
        progressBar = findViewById(R.id.progressBar);

        btnKeepReservation.setOnClickListener(v -> finish());
        btnConfirmCancel.setOnClickListener(v -> performCancellation());

        loadReservationDetails();
    }

    private void loadReservationDetails() {
        setLoading(true);
        ApiClient.getService(this).getReservationDetails(reservationId).enqueue(new Callback<ReservationDetailsDto>() {
            @Override
            public void onResponse(Call<ReservationDetailsDto> call, Response<ReservationDetailsDto> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    details = response.body();
                    displayDetails();
                } else {
                    Toast.makeText(CancelReservationActivity.this, "Could not load reservation details", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ReservationDetailsDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(CancelReservationActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void displayDetails() {
        String shortId = details.getId() != null && details.getId().length() > 8 ? details.getId().substring(0, 8) : details.getId();
        tvReservationId.setText("Booking Reference: #" + shortId);

        String date = details.getSlotDate() != null ? details.getSlotDate().split("T")[0] : "Date TBD";
        String start = details.getStartTime() != null ? details.getStartTime() : "00:00";
        String end = details.getEndTime() != null ? details.getEndTime() : "00:00";

        tvDetails.setText(String.format(Locale.US, "Quantity: %.1f kWh ($%.2f)\\nWindow: %s (%s - %s)\\nSeller: %s",
                details.getEnergyAmount(), details.getTotalPrice(), date, start, end, details.getSellerProsumerId()));

        double hoursLeft = details.getHoursUntilSlot();
        if (hoursLeft < 12.0) {
            tvNoticeText.setText(String.format(Locale.US, "⚠️ Notice: Energy slot delivery is in %.1f hours. Cancellations require 12 hours advance notice.", hoursLeft));
            tvNoticeText.setTextColor(getResources().getColor(R.color.danger));
        } else {
            tvNoticeText.setText(String.format(Locale.US, "✅ 12-hour notice window verified (%.1f hours remaining before slot delivery).", hoursLeft));
            tvNoticeText.setTextColor(getResources().getColor(R.color.success));
        }
    }

    private void performCancellation() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        ApiClient.getService(this).cancelReservation(reservationId).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                setLoading(false);
                if (response.isSuccessful()) {
                    ReservationDto dummyCancelled = new ReservationDto();
                    Intent intent = new Intent(CancelReservationActivity.this, ReservationSummaryActivity.class);
                    intent.putExtra("EXTRA_ACTION", "CANCELLED");
                    intent.putExtra("EXTRA_RESERVATION_ID", reservationId);
                    if (details != null) {
                        intent.putExtra("EXTRA_ENERGY_AMOUNT", details.getEnergyAmount());
                        intent.putExtra("EXTRA_TOTAL_PRICE", details.getTotalPrice());
                        intent.putExtra("EXTRA_SELLER", details.getSellerProsumerId());
                        intent.putExtra("EXTRA_WINDOW", details.getStartTime() + " - " + details.getEndTime());
                    }
                    startActivity(intent);
                    finish();
                } else {
                    String msg = "Could not cancel reservation";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) msg = json.getString("message");
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(CancelReservationActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                setLoading(false);
                Toast.makeText(CancelReservationActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnConfirmCancel.setEnabled(!isLoading);
        btnKeepReservation.setEnabled(!isLoading);
    }
}
