package com.smartsolar.microgrid;

import android.app.Application;
import com.google.android.gms.maps.MapsInitializer;
import java.util.concurrent.Executors;

/**
 * SmartSolarApplication — Custom Application class for app-wide initialization.
 * Pre-warms Google Maps SDK in the background to avoid UI thread ANR freezes.
 */
public class SmartSolarApplication extends Application {

    @Override
    public void onCreate() {
        super.onCreate();

        // Pre-warm Google Maps SDK in background using LEGACY renderer
        Executors.newSingleThreadExecutor().execute(() -> {
            try {
                MapsInitializer.initialize(getApplicationContext(), MapsInitializer.Renderer.LEGACY, null);
            } catch (Exception ignored) {}
        });
    }
}
