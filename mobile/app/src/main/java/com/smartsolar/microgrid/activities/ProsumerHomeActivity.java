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
 * ProsumerHomeActivity — Primary operational hub for solar prosumers.
 * Features persistent Material Design 3 Bottom Navigation for rapid access to:
 *   - Live Stats / Microgrid Dashboard
 *   - Available Energy Slot Trading
 *   - Personal Booking & Reservation Management
 *   - Nearby Grid Station Google Maps
 *   - Prosumer Profile & Account Controls
 * Aligned with Phase 6 polish criteria: Native navigation, responsive UI, and offline robustness.
 */
public class ProsumerHomeActivity extends AppCompatActivity {

    private SessionManager sessionManager;
    private BottomNavigationView bottomNav;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_prosumer_home);

        sessionManager = new SessionManager(this);

        initViews();
        setupBottomNavigation();
    }

    /**
     * Initializes layout controls and displays user session information.
     */
    private void initViews() {
        TextView tvWelcome = findViewById(R.id.tvWelcome);
        TextView tvUserRole = findViewById(R.id.tvUserRole);
        TextView tvNic = findViewById(R.id.tvNic);
        Button btnLogout = findViewById(R.id.btnLogout);
        Button btnProfile = findViewById(R.id.btnProfile);
        Button btnViewSlots = findViewById(R.id.btnViewSlots);
        Button btnMyReservations = findViewById(R.id.btnMyReservations);
        Button btnNearbyNodes = findViewById(R.id.btnNearbyNodes);
        Button btnDashboard = findViewById(R.id.btnDashboard);
        bottomNav = findViewById(R.id.bottomNav);

        tvWelcome.setText("Hello, " + sessionManager.getFullName());
        tvUserRole.setText("Role: " + sessionManager.getRole());
        tvNic.setText("NIC: " + sessionManager.getNic());

        btnProfile.setOnClickListener(v -> startActivity(new Intent(this, ProfileActivity.class)));
        btnViewSlots.setOnClickListener(v -> startActivity(new Intent(this, AvailableSlotsActivity.class)));
        btnMyReservations.setOnClickListener(v -> startActivity(new Intent(this, MyReservationsActivity.class)));
        btnNearbyNodes.setOnClickListener(v -> startActivity(new Intent(this, MapActivity.class)));
        if (btnDashboard != null) {
            btnDashboard.setOnClickListener(v -> startActivity(new Intent(this, DashboardActivity.class)));
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
            } else if (id == R.id.nav_slots) {
                startActivity(new Intent(this, AvailableSlotsActivity.class));
                return true;
            } else if (id == R.id.nav_reservations) {
                startActivity(new Intent(this, MyReservationsActivity.class));
                return true;
            } else if (id == R.id.nav_map) {
                startActivity(new Intent(this, MapActivity.class));
                return true;
            } else if (id == R.id.nav_profile) {
                startActivity(new Intent(this, ProfileActivity.class));
                return true;
            }
            return false;
        });
    }

    /**
     * Clears local SQLite session and redirects to LoginActivity.
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
