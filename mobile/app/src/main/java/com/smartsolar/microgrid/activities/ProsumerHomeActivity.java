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
        android.view.View btnLogout = findViewById(R.id.btnLogout);
        android.view.View btnProfile = findViewById(R.id.btnProfile);
        android.view.View btnViewSlots = findViewById(R.id.btnViewSlots);
        android.view.View btnMyReservations = findViewById(R.id.btnMyReservations);
        android.view.View btnNearbyNodes = findViewById(R.id.btnNearbyNodes);
        android.view.View btnDashboard = findViewById(R.id.btnDashboard);
        bottomNav = findViewById(R.id.bottomNav);

        String name = sessionManager.getFullName();
        tvWelcome.setText(name != null && !name.trim().isEmpty() ? name : "Solar Prosumer");
        String role = sessionManager.getRole();
        tvUserRole.setText(role != null && !role.trim().isEmpty() ? role : "Prosumer");
        String nic = sessionManager.getNic();
        tvNic.setText(nic != null && !nic.trim().isEmpty() ? "NIC: " + nic : "NIC: Verified");

        btnProfile.setOnClickListener(v -> navigateTo(ProfileActivity.class));
        btnViewSlots.setOnClickListener(v -> navigateTo(AvailableSlotsActivity.class));
        btnMyReservations.setOnClickListener(v -> navigateTo(MyReservationsActivity.class));
        btnNearbyNodes.setOnClickListener(v -> navigateTo(MapActivity.class));
        if (btnDashboard != null) {
            btnDashboard.setOnClickListener(v -> navigateTo(DashboardActivity.class));
        }

        btnLogout.setOnClickListener(v -> executeLogout());
    }

    private void navigateTo(Class<?> targetActivity) {
        Intent intent = new Intent(this, targetActivity);
        intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
        startActivity(intent);
    }

    /**
     * Configures the BottomNavigationView item selection listener.
     */
    private void setupBottomNavigation() {
        bottomNav.setOnItemSelectedListener(item -> {
            int id = item.getItemId();
            if (id == R.id.nav_dashboard) {
                navigateTo(DashboardActivity.class);
                return true;
            } else if (id == R.id.nav_slots) {
                navigateTo(AvailableSlotsActivity.class);
                return true;
            } else if (id == R.id.nav_reservations) {
                navigateTo(MyReservationsActivity.class);
                return true;
            } else if (id == R.id.nav_map) {
                navigateTo(MapActivity.class);
                return true;
            } else if (id == R.id.nav_profile) {
                navigateTo(ProfileActivity.class);
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
