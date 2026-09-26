package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.database.SessionManager;

/**
 * OperatorHomeActivity — Operational console for Grid Station Operators.
 * Features persistent Material Design 3 Bottom Navigation for rapid access to:
 *   - Real-time Microgrid Telemetry & Dashboard
 *   - Booking Approvals & Queue Management
 *   - ZXing Camera QR Code Token Scanning
 *   - Station Geo-Location Map
 *   - Historical Delivery Audit Logs
 * Aligned with Phase 6 polish criteria: Unified station workflows and operator ergonomics.
 */
public class OperatorHomeActivity extends AppCompatActivity {

    private SessionManager sessionManager;
    private BottomNavigationView bottomNav;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_operator_home);

        sessionManager = new SessionManager(this);

        initViews();
        setupBottomNavigation();
    }

    /**
     * Initializes layout controls and user identity displays.
     */
    private void initViews() {
        TextView tvWelcome = findViewById(R.id.tvWelcome);
        TextView tvUserRole = findViewById(R.id.tvUserRole);
        Button btnLogout = findViewById(R.id.btnLogout);
        Button btnScanQr = findViewById(R.id.btnScanQr);
        Button btnPendingBookings = findViewById(R.id.btnPendingBookings);
        Button btnCurrentBookings = findViewById(R.id.btnCurrentBookings);
        Button btnMonitoring = findViewById(R.id.btnMonitoring);
        Button btnNearbyStations = findViewById(R.id.btnNearbyStations);
        bottomNav = findViewById(R.id.bottomNav);

        tvWelcome.setText("Operator: " + sessionManager.getFullName());
        tvUserRole.setText("Role: " + sessionManager.getRole());

        btnScanQr.setOnClickListener(v -> startActivity(new Intent(this, QrScannerActivity.class)));
        btnPendingBookings.setOnClickListener(v -> startActivity(new Intent(this, PendingBookingsActivity.class)));
        if (btnCurrentBookings != null) {
            btnCurrentBookings.setOnClickListener(v -> startActivity(new Intent(this, CurrentBookingsActivity.class)));
        }
        btnMonitoring.setOnClickListener(v -> startActivity(new Intent(this, DashboardActivity.class)));

        if (btnNearbyStations != null) {
            btnNearbyStations.setOnClickListener(v -> startActivity(new Intent(this, MapActivity.class)));
        }

        btnLogout.setOnClickListener(v -> executeLogout());
    }

    /**
     * Configures the BottomNavigationView item selection listener.
     */
    private void setupBottomNavigation() {
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_dashboard) {
                startActivity(new Intent(this, DashboardActivity.class));
                return true;
            } else if (id == R.id.nav_bookings) {
                startActivity(new Intent(this, CurrentBookingsActivity.class));
                return true;
            } else if (id == R.id.nav_scan) {
                startActivity(new Intent(this, QrScannerActivity.class));
                return true;
            } else if (id == R.id.nav_map) {
                startActivity(new Intent(this, MapActivity.class));
                return true;
            } else if (id == R.id.nav_history) {
                startActivity(new Intent(this, BookingHistoryActivity.class));
                return true;
            }
            return false;
        });
    }

    /**
     * Clears session and returns to login screen.
     */
    private void executeLogout() {
        sessionManager.clearSession();
        Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show();
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
