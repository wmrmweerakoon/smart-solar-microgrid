package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.CreateReservationRequest;
import com.smartsolar.microgrid.api.models.EnergySlotDto;
import com.smartsolar.microgrid.api.models.ReservationDto;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.NetworkUtils;
import org.json.JSONObject;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CreateReservationActivity extends AppCompatActivity {

    private TextView tvSellerInfo, tvNodeInfo, tvTimeWindow, tvMaxCapacity, tvRate, tvEstimatedTotal;
    private EditText etEnergyAmount, etNotes;
    private Button btnConfirmReservation, btnCancelTop;
    private ProgressBar progressBar;

    private EnergySlotDto slot;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_create_reservation);

        sessionManager = new SessionManager(this);

        slot = (EnergySlotDto) getIntent().getSerializableExtra("EXTRA_ENERGY_SLOT");
        if (slot == null) {
            Toast.makeText(this, "Slot data not found", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        tvSellerInfo = findViewById(R.id.tvSellerInfo);
        tvNodeInfo = findViewById(R.id.tvNodeInfo);
        tvTimeWindow = findViewById(R.id.tvTimeWindow);
        tvMaxCapacity = findViewById(R.id.tvMaxCapacity);
        tvRate = findViewById(R.id.tvRate);
        tvEstimatedTotal = findViewById(R.id.tvEstimatedTotal);
        etEnergyAmount = findViewById(R.id.etEnergyAmount);
        etNotes = findViewById(R.id.etNotes);
        btnConfirmReservation = findViewById(R.id.btnConfirmReservation);
        btnCancelTop = findViewById(R.id.btnCancelTop);
        progressBar = findViewById(R.id.progressBar);

        btnCancelTop.setOnClickListener(v -> finish());

        populateSlotDetails();

        etEnergyAmount.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { updateEstimatedTotal(); }
            @Override public void afterTextChanged(Editable s) {}
        });

        btnConfirmReservation.setOnClickListener(v -> submitReservation());
    }

    private void populateSlotDetails() {
        tvSellerInfo.setText("Seller: " + slot.getProsumerId());
        tvNodeInfo.setText("Station Node: " + (slot.getMicrogridNodeId() != null ? slot.getMicrogridNodeId() : "Grid Central"));

        String date = slot.getSlotDate() != null ? slot.getSlotDate().split("T")[0] : "Date TBD";
        String start = slot.getStartTime() != null ? slot.getStartTime() : "00:00";
        String end = slot.getEndTime() != null ? slot.getEndTime() : "00:00";
        tvTimeWindow.setText(String.format("Delivery Window: %s (%s - %s)", date, start, end));

        tvMaxCapacity.setText(String.format(Locale.US, "Max Capacity: %.1f kWh", slot.getEnergyAmount()));
        tvRate.setText(String.format(Locale.US, "Rate: $%.2f / kWh", slot.getPricePerUnit()));

        // Pre-fill full amount by default
        etEnergyAmount.setText(String.valueOf(slot.getEnergyAmount()));
        updateEstimatedTotal();
    }

    private void updateEstimatedTotal() {
        String amountStr = etEnergyAmount.getText().toString().trim();
        try {
            double amount = Double.parseDouble(amountStr);
            double total = amount * slot.getPricePerUnit();
            tvEstimatedTotal.setText(String.format(Locale.US, "$%.2f", Math.max(0, total)));
        } catch (NumberFormatException e) {
            tvEstimatedTotal.setText("$0.00");
        }
    }

    private void submitReservation() {
        String loggedInNic = sessionManager.getNic();
        if (loggedInNic == null || loggedInNic.isEmpty()) loggedInNic = sessionManager.getUsername();

        // 1. Anti-Self Trading Validation
        if (loggedInNic.equalsIgnoreCase(slot.getProsumerId())) {
            Toast.makeText(this, "Anti-Self-Trading: You cannot reserve energy from your own slot!", Toast.LENGTH_LONG).show();
            return;
        }

        String amountStr = etEnergyAmount.getText().toString().trim();
        double amount;
        try {
            amount = Double.parseDouble(amountStr);
            if (amount <= 0) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            etEnergyAmount.setError("Please enter a valid energy quantity > 0");
            etEnergyAmount.requestFocus();
            return;
        }

        if (amount > slot.getEnergyAmount()) {
            etEnergyAmount.setError("Quantity cannot exceed available " + slot.getEnergyAmount() + " kWh");
            etEnergyAmount.requestFocus();
            return;
        }

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        String notes = etNotes.getText().toString().trim();
        CreateReservationRequest request = new CreateReservationRequest(slot.getId(), loggedInNic, amount, notes);

        ApiClient.getService(this).createReservation(request).enqueue(new Callback<ReservationDto>() {
            @Override
            public void onResponse(Call<ReservationDto> call, Response<ReservationDto> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ReservationDto created = response.body();
                    Intent intent = new Intent(CreateReservationActivity.this, ReservationSummaryActivity.class);
                    intent.putExtra("EXTRA_ACTION", "CREATED");
                    intent.putExtra("EXTRA_RESERVATION", created);
                    intent.putExtra("EXTRA_SLOT", slot);
                    startActivity(intent);
                    finish();
                } else {
                    String msg = "Could not create reservation";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) msg = json.getString("message");
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(CreateReservationActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ReservationDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(CreateReservationActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnConfirmReservation.setEnabled(!isLoading);
    }
}
