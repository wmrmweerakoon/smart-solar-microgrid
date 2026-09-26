package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.Constants;

/**
 * SplashActivity — Branded launch activity with automatic role-based session routing.
 * Component: Phase 1 & 6 — App Entry & Splash
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            SessionManager sessionManager = new SessionManager(SplashActivity.this);
            if (sessionManager.isLoggedIn()) {
                String role = sessionManager.getRole();
                if (Constants.ROLE_OPERATOR.equalsIgnoreCase(role) || Constants.ROLE_BACKOFFICE.equalsIgnoreCase(role)) {
                    startActivity(new Intent(SplashActivity.this, OperatorHomeActivity.class));
                } else {
                    startActivity(new Intent(SplashActivity.this, ProsumerHomeActivity.class));
                }
            } else {
                startActivity(new Intent(SplashActivity.this, LoginActivity.class));
            }
            finish();
        }, 1500);
    }
}
