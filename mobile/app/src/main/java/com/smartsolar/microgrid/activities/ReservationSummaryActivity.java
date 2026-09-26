package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.models.EnergySlotDto;
import com.smartsolar.microgrid.api.models.ReservationDto;
import com.smartsolar.microgrid.database.SessionManager;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * ReservationSummaryActivity — Transaction summary receipt screen displaying booking reference and QR shortcut.
 * Component: Member 2 (Dilani) — Transaction Summary Receipt
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ReservationSummaryActivity extends AppCompatActivity {

    private TextView tvActionIcon, tvActionTitle, tvActionSubtitle, tvStatusBadge;
    private TextView tvSummaryId, tvSummaryEnergy, tvSummaryPrice, tvSummaryWindow, tvSummaryParties, tvSummaryTimestamp;
    private Button btnBrowseMore, btnBackToHome, btnViewQrToken;
    private SessionManager sessionManager;
    private ReservationDto currentReservation;
    private EnergySlotDto currentSlot;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_reservation_summary);

        sessionManager = new SessionManager(this);

        tvActionIcon = findViewById(R.id.tvActionIcon);
        tvActionTitle = findViewById(R.id.tvActionTitle);
        tvActionSubtitle = findViewById(R.id.tvActionSubtitle);
        tvStatusBadge = findViewById(R.id.tvStatusBadge);
        tvSummaryId = findViewById(R.id.tvSummaryId);
        tvSummaryEnergy = findViewById(R.id.tvSummaryEnergy);
        tvSummaryPrice = findViewById(R.id.tvSummaryPrice);
        tvSummaryWindow = findViewById(R.id.tvSummaryWindow);
        tvSummaryParties = findViewById(R.id.tvSummaryParties);
        tvSummaryTimestamp = findViewById(R.id.tvSummaryTimestamp);
        btnBrowseMore = findViewById(R.id.btnBrowseMore);
        btnBackToHome = findViewById(R.id.btnBackToHome);
        btnViewQrToken = findViewById(R.id.btnViewQrToken);

        populateSummary();

        // Phase 5 (Member 4): Launch QR token viewer
        btnViewQrToken.setOnClickListener(v -> {
            if (currentReservation != null) {
                Intent intent = new Intent(ReservationSummaryActivity.this, QrGeneratorActivity.class);
                intent.putExtra("EXTRA_RESERVATION_ID", currentReservation.getId());
                intent.putExtra("EXTRA_BUYER_NIC", sessionManager.getNic());
                intent.putExtra("EXTRA_ENERGY_AMOUNT", currentReservation.getEnergyAmount());
                intent.putExtra("EXTRA_TOTAL_PRICE", currentReservation.getTotalPrice());
                if (currentSlot != null) {
                    intent.putExtra("EXTRA_SLOT_DATE", currentSlot.getSlotDate());
                    intent.putExtra("EXTRA_START_TIME", currentSlot.getStartTime());
                    intent.putExtra("EXTRA_END_TIME", currentSlot.getEndTime());
                    intent.putExtra("EXTRA_NODE_ID", currentSlot.getMicrogridNodeId());
                }
                startActivity(intent);
            }
        });

        btnBrowseMore.setOnClickListener(v -> {
            Intent intent = new Intent(ReservationSummaryActivity.this, AvailableSlotsActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        });

        btnBackToHome.setOnClickListener(v -> {
            Intent intent = new Intent(ReservationSummaryActivity.this, ProsumerHomeActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            finish();
        });
    }

    private void populateSummary() {
        String action = getIntent().getStringExtra("EXTRA_ACTION");
        if (action == null) action = "CREATED";

        currentReservation = (ReservationDto) getIntent().getSerializableExtra("EXTRA_RESERVATION");
        currentSlot = (EnergySlotDto) getIntent().getSerializableExtra("EXTRA_SLOT");
        ReservationDto res = currentReservation;
        EnergySlotDto slot = currentSlot;

        String loggedInNic = sessionManager.getNic();
        if (loggedInNic == null || loggedInNic.isEmpty()) loggedInNic = sessionManager.getUsername();

        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date());
        tvSummaryTimestamp.setText("Processed At: " + now);

        if ("CREATED".equalsIgnoreCase(action)) {
            tvActionIcon.setText("✅");
            tvActionTitle.setText("Reservation Placed Successfully!");
            tvActionSubtitle.setText("Your energy booking request is registered and pending grid confirmation.");
            tvStatusBadge.setText("PENDING");
            tvStatusBadge.setBackgroundColor(getResources().getColor(R.color.accent));
            btnViewQrToken.setVisibility(View.VISIBLE);

            if (res != null) {
                String shortId = res.getId() != null && res.getId().length() > 8 ? res.getId().substring(0, 8) : res.getId();
                tvSummaryId.setText("REF #" + shortId);
                tvSummaryEnergy.setText(String.format(Locale.US, "%.1f kWh", res.getEnergyAmount()));
                tvSummaryPrice.setText(String.format(Locale.US, "$%.2f", res.getTotalPrice()));
                tvSummaryParties.setText("Buyer: " + loggedInNic + " | Seller: " + res.getSellerProsumerId());
            }

            if (slot != null) {
                String date = slot.getSlotDate() != null ? slot.getSlotDate().split("T")[0] : "Date TBD";
                tvSummaryWindow.setText(String.format("%s (%s - %s)", date, slot.getStartTime(), slot.getEndTime()));
            }

        } else if ("UPDATED".equalsIgnoreCase(action)) {
            tvActionIcon.setText("✏️");
            tvActionTitle.setText("Reservation Updated Successfully!");
            tvActionSubtitle.setText("Your revised energy reservation details have been committed.");
            tvStatusBadge.setText("UPDATED");
            tvStatusBadge.setBackgroundColor(getResources().getColor(R.color.primary));
            btnViewQrToken.setVisibility(View.VISIBLE);

            if (res != null) {
                String shortId = res.getId() != null && res.getId().length() > 8 ? res.getId().substring(0, 8) : res.getId();
                tvSummaryId.setText("REF #" + shortId);
                tvSummaryEnergy.setText(String.format(Locale.US, "%.1f kWh", res.getEnergyAmount()));
                tvSummaryPrice.setText(String.format(Locale.US, "$%.2f", res.getTotalPrice()));
                tvSummaryParties.setText("Buyer: " + loggedInNic + " | Seller: " + res.getSellerProsumerId());
            }
            tvSummaryWindow.setText("Updated schedule active");

        } else if ("CANCELLED".equalsIgnoreCase(action)) {
            tvActionIcon.setText("❌");
            tvActionTitle.setText("Reservation Cancelled");
            tvActionSubtitle.setText("The reservation has been voided and the energy slot released.");
            tvStatusBadge.setText("CANCELLED");
            tvStatusBadge.setBackgroundColor(getResources().getColor(R.color.danger));
            btnViewQrToken.setVisibility(View.GONE);

            String resId = getIntent().getStringExtra("EXTRA_RESERVATION_ID");
            double amount = getIntent().getDoubleExtra("EXTRA_ENERGY_AMOUNT", 0.0);
            double price = getIntent().getDoubleExtra("EXTRA_TOTAL_PRICE", 0.0);
            String seller = getIntent().getStringExtra("EXTRA_SELLER");
            String window = getIntent().getStringExtra("EXTRA_WINDOW");

            String shortId = resId != null && resId.length() > 8 ? resId.substring(0, 8) : resId;
            tvSummaryId.setText("REF #" + (shortId != null ? shortId : "VOIDED"));
            tvSummaryEnergy.setText(String.format(Locale.US, "%.1f kWh (Released)", amount));
            tvSummaryPrice.setText(String.format(Locale.US, "$%.2f (Voided)", price));
            tvSummaryParties.setText("Buyer: " + loggedInNic + " | Seller: " + (seller != null ? seller : "--"));
            tvSummaryWindow.setText(window != null ? window : "Schedule Cancelled");
        }
    }
}
