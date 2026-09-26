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
import com.smartsolar.microgrid.api.models.UpdateReservationRequest;
import com.smartsolar.microgrid.utils.NetworkUtils;
import org.json.JSONObject;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * UpdateReservationActivity — Reservation update screen with 12-hour notice lockout validation.
 * Component: Member 2 (Dilani) — Update Reservation Workflow
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class UpdateReservationActivity extends AppCompatActivity {

    private TextView tvNoticeText, tvReservationId, tvSlotSchedule, tvCurrentAmount;
    private EditText etNewAmount, etNewNotes;
    private Button btnSubmitUpdate, btnBack;
    private ProgressBar progressBar;

    private String reservationId;
    private ReservationDetailsDto details;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_update_reservation);

        reservationId = getIntent().getStringExtra("EXTRA_RESERVATION_ID");
        if (reservationId == null) {
            Toast.makeText(this, "Reservation ID missing", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        tvNoticeText = findViewById(R.id.tvNoticeText);
        tvReservationId = findViewById(R.id.tvReservationId);
        tvSlotSchedule = findViewById(R.id.tvSlotSchedule);
        tvCurrentAmount = findViewById(R.id.tvCurrentAmount);
        etNewAmount = findViewById(R.id.etNewAmount);
        etNewNotes = findViewById(R.id.etNewNotes);
        btnSubmitUpdate = findViewById(R.id.btnSubmitUpdate);
        btnBack = findViewById(R.id.btnBack);
        progressBar = findViewById(R.id.progressBar);

        btnBack.setOnClickListener(v -> finish());
        btnSubmitUpdate.setOnClickListener(v -> submitUpdate());

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
                    Toast.makeText(UpdateReservationActivity.this, "Could not load reservation details", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ReservationDetailsDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(UpdateReservationActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void displayDetails() {
        String shortId = details.getId() != null && details.getId().length() > 8 ? details.getId().substring(0, 8) : details.getId();
        tvReservationId.setText("Reference: #" + shortId);

        String date = details.getSlotDate() != null ? details.getSlotDate().split("T")[0] : "Date TBD";
        String start = details.getStartTime() != null ? details.getStartTime() : "00:00";
        String end = details.getEndTime() != null ? details.getEndTime() : "00:00";
        tvSlotSchedule.setText(String.format("Delivery Window: %s (%s - %s)", date, start, end));

        tvCurrentAmount.setText(String.format(Locale.US, "Current Quantity: %.1f kWh ($%.2f)", details.getEnergyAmount(), details.getTotalPrice()));

        etNewAmount.setText(String.valueOf(details.getEnergyAmount()));
        etNewNotes.setText(details.getNotes() != null ? details.getNotes() : "");

        // 12-Hour Advance Notice Validation
        double hoursLeft = details.getHoursUntilSlot();
        if (hoursLeft < 12.0) {
            tvNoticeText.setText(String.format(Locale.US, "⚠️ Lockout: Slot starts in %.1f hours. Reservations can only be updated with at least 12 hours notice.", hoursLeft));
            tvNoticeText.setTextColor(getResources().getColor(R.color.danger));
            btnSubmitUpdate.setEnabled(false);
            btnSubmitUpdate.setText("Modifications Locked (<12 hrs notice)");
        } else {
            tvNoticeText.setText(String.format(Locale.US, "✅ Notice check passed: %.1f hours remaining before energy delivery window.", hoursLeft));
            tvNoticeText.setTextColor(getResources().getColor(R.color.success));
            btnSubmitUpdate.setEnabled(true);
        }
    }

    private void submitUpdate() {
        if (details != null && details.getHoursUntilSlot() < 12.0) {
            Toast.makeText(this, "Cannot update: 12-hour advance notice is required!", Toast.LENGTH_LONG).show();
            return;
        }

        String amountStr = etNewAmount.getText().toString().trim();
        double newAmount;
        try {
            newAmount = Double.parseDouble(amountStr);
            if (newAmount <= 0) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            etNewAmount.setError("Please enter a valid quantity > 0");
            etNewAmount.requestFocus();
            return;
        }

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        String notes = etNewNotes.getText().toString().trim();
        UpdateReservationRequest request = new UpdateReservationRequest(newAmount, notes);

        ApiClient.getService(this).updateReservation(reservationId, request).enqueue(new Callback<ReservationDto>() {
            @Override
            public void onResponse(Call<ReservationDto> call, Response<ReservationDto> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ReservationDto updated = response.body();
                    Intent intent = new Intent(UpdateReservationActivity.this, ReservationSummaryActivity.class);
                    intent.putExtra("EXTRA_ACTION", "UPDATED");
                    intent.putExtra("EXTRA_RESERVATION", updated);
                    startActivity(intent);
                    finish();
                } else {
                    String msg = "Could not update reservation";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) msg = json.getString("message");
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(UpdateReservationActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ReservationDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(UpdateReservationActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnSubmitUpdate.setEnabled(!isLoading && (details == null || details.getHoursUntilSlot() >= 12.0));
    }
}
