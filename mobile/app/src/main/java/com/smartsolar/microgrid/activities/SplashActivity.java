package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.animation.DecelerateInterpolator;
import android.view.animation.OvershootInterpolator;
import android.widget.ImageView;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.Constants;

/**
 * SplashActivity — Branded launch activity with entrance animations and automatic role-based session routing.
 * Component: Phase 1 & 6 — App Entry & Splash
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class SplashActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        ImageView ivLogo = findViewById(R.id.ivSplashLogo);
        View llText = findViewById(R.id.llSplashText);

        if (ivLogo != null) {
            ivLogo.setAlpha(0f);
            ivLogo.setScaleX(0.6f);
            ivLogo.setScaleY(0.6f);
            ivLogo.animate()
                    .alpha(1f)
                    .scaleX(1f)
                    .scaleY(1f)
                    .setDuration(900)
                    .setInterpolator(new OvershootInterpolator(1.2f))
                    .start();
        }

        if (llText != null) {
            llText.setAlpha(0f);
            llText.setTranslationY(40f);
            llText.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(800)
                    .setStartDelay(350)
                    .setInterpolator(new DecelerateInterpolator())
                    .start();
        }

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
            overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
        }, 2200);
    }
}
