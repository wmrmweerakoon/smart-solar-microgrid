package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.database.SessionManager;

/**
 * OperatorHomeActivity — Operational console for Grid Operators.
 * Provides controls for scanning prosumer QR tokens, reviewing pending bookings,
 * viewing live station maps, and accessing microgrid telemetry dashboards.
 */
public class OperatorHomeActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_home);

        sessionManager = new SessionManager(this);

        TextView tvWelcome = findViewById(R.id.tvWelcome);
        TextView tvUserRole = findViewById(R.id.tvUserRole);
        Button btnLogout = findViewById(R.id.btnLogout);
        Button btnScanQr = findViewById(R.id.btnScanQr);
        Button btnPendingBookings = findViewById(R.id.btnPendingBookings);
        Button btnMonitoring = findViewById(R.id.btnMonitoring);
        Button btnNearbyStations = findViewById(R.id.btnNearbyStations);

        tvWelcome.setText("Operator: " + sessionManager.getFullName());
        tvUserRole.setText("Role: " + sessionManager.getRole());

        // Phase 5 (Member 4): Launch ZXing QR Scanner
        btnScanQr.setOnClickListener(v -> {
            Intent intent = new Intent(OperatorHomeActivity.this, QrScannerActivity.class);
            startActivity(intent);
        });

        // Phase 5 (Member 4): Launch Nearby Stations Map
        if (btnNearbyStations != null) {
            btnNearbyStations.setOnClickListener(v -> {
                Intent intent = new Intent(OperatorHomeActivity.this, MapActivity.class);
                startActivity(intent);
            });
        }

        btnPendingBookings.setOnClickListener(v -> {
            Intent intent = new Intent(OperatorHomeActivity.this, PendingBookingsActivity.class);
            startActivity(intent);
        });

        btnMonitoring.setOnClickListener(v -> {
            Intent intent = new Intent(OperatorHomeActivity.this, DashboardActivity.class);
            startActivity(intent);
        });

        btnLogout.setOnClickListener(v -> {
            sessionManager.clearSession();
            Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
            Intent intent = new Intent(this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        });
    }
}
