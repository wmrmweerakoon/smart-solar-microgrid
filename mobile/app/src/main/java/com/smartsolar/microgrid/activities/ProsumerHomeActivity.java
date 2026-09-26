package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.database.SessionManager;

public class ProsumerHomeActivity extends AppCompatActivity {

    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_prosumer_home);

        sessionManager = new SessionManager(this);

        TextView tvWelcome = findViewById(R.id.tvWelcome);
        TextView tvUserRole = findViewById(R.id.tvUserRole);
        TextView tvNic = findViewById(R.id.tvNic);
        Button btnLogout = findViewById(R.id.btnLogout);
        Button btnProfile = findViewById(R.id.btnProfile);
        Button btnViewSlots = findViewById(R.id.btnViewSlots);
        Button btnMyReservations = findViewById(R.id.btnMyReservations);
        Button btnNearbyNodes = findViewById(R.id.btnNearbyNodes);

        tvWelcome.setText("Hello, " + sessionManager.getFullName());
        tvUserRole.setText("Role: " + sessionManager.getRole());
        tvNic.setText("NIC: " + sessionManager.getNic());

        btnProfile.setOnClickListener(v -> {
            Intent intent = new Intent(ProsumerHomeActivity.this, ProfileActivity.class);
            startActivity(intent);
        });

        btnViewSlots.setOnClickListener(v -> {
            Intent intent = new Intent(ProsumerHomeActivity.this, AvailableSlotsActivity.class);
            startActivity(intent);
        });

        btnMyReservations.setOnClickListener(v -> {
            Intent intent = new Intent(ProsumerHomeActivity.this, MyReservationsActivity.class);
            startActivity(intent);
        });

        btnNearbyNodes.setOnClickListener(v -> {
            Toast.makeText(this, "Nearby Stations Map (Phase 5)", Toast.LENGTH_SHORT).show();
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
