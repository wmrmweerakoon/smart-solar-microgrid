package com.smartsolar.microgrid.utils;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;
import androidx.annotation.NonNull;
import com.smartsolar.microgrid.api.ApiClient;
import java.io.IOException;
import java.util.concurrent.TimeUnit;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * ServerConfig — Manages runtime backend endpoint switching, persistence,
 * automatic URL formatting, and active health checks for USB, Hotspot, and Wi-Fi modes.
 */
public class ServerConfig {

    private static final String PREF_NAME = "solar_server_prefs";
    private static final String KEY_CUSTOM_URL = "custom_backend_url";
    public static final String DEFAULT_PORT = "5299";

    public interface TestCallback {
        void onSuccess(int httpCode, long latencyMs);
        void onError(String errorMessage);
    }

    /**
     * Retrieves the currently active base URL from persistent storage,
     * falling back to the default emulator/USB configuration.
     */
    public static String getBaseUrl(@NonNull Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        String saved = prefs.getString(KEY_CUSTOM_URL, null);
        if (saved != null && !saved.trim().isEmpty()) {
            return formatUrl(saved);
        }
        return Constants.API_BASE_URL;
    }

    /**
     * Saves a new backend base URL to local storage and invalidates the cached Retrofit client.
     */
    public static void saveBaseUrl(@NonNull Context context, @NonNull String rawUrl) {
        String formatted = formatUrl(rawUrl);
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_CUSTOM_URL, formatted).apply();
        ApiClient.resetClient();
    }

    /**
     * Clears custom URL preference, reverting back to automatic emulator/USB detection.
     */
    public static void resetToDefault(@NonNull Context context) {
        SharedPreferences prefs = context.getApplicationContext().getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().remove(KEY_CUSTOM_URL).apply();
        ApiClient.resetClient();
    }

    /**
     * Automatically formats whatever the user enters:
     * 1. Strips leading and trailing whitespaces and trailing slashes.
     * 2. Adds "http://" if protocol is missing.
     * 3. Checks if a port is omitted (e.g. "192.168.1.5" or "localhost"); auto-adds ":5299" (or keeps :8000 if provided).
     * 4. Ensures the path strictly terminates with "/api/".
     */
    @NonNull
    public static String formatUrl(String input) {
        if (input == null || input.trim().isEmpty()) {
            return Constants.API_BASE_URL;
        }

        String url = input.trim();

        // 1. Ensure scheme is present
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://" + url;
        }

        // 2. Strip trailing slashes
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }

        // 3. Extract scheme and the rest
        String scheme = url.startsWith("https://") ? "https://" : "http://";
        String noScheme = url.substring(scheme.length());

        // Separate host+port from any path
        String hostPort;
        String path = "";
        int slashIdx = noScheme.indexOf('/');
        if (slashIdx != -1) {
            hostPort = noScheme.substring(0, slashIdx);
            path = noScheme.substring(slashIdx);
        } else {
            hostPort = noScheme;
        }

        // 4. Auto-add port if omitted
        if (!hostPort.contains(":")) {
            hostPort = hostPort + ":" + DEFAULT_PORT;
        }

        // 5. Clean path: ensure ends with /api/
        if (path.isEmpty() || path.equals("/")) {
            path = "/api/";
        } else {
            if (!path.endsWith("/")) {
                path = path + "/";
            }
            if (!path.endsWith("/api/")) {
                if (path.equals("/api/")) {
                    // already fine
                } else if (!path.contains("/api/")) {
                    path = path + "api/";
                }
            }
        }

        return scheme + hostPort + path;
    }

    /**
     * Asynchronously pings the server's /api/health endpoint (with fallback to /api/microgrid)
     * using a short 4-second timeout to verify connectivity.
     */
    public static void testConnection(@NonNull String rawUrl, @NonNull TestCallback callback) {
        final String base = formatUrl(rawUrl);
        final String healthEndpoint = base + "health";
        final Handler mainHandler = new Handler(Looper.getMainLooper());
        final long startTime = System.currentTimeMillis();

        OkHttpClient testClient = new OkHttpClient.Builder()
                .connectTimeout(4, TimeUnit.SECONDS)
                .readTimeout(4, TimeUnit.SECONDS)
                .writeTimeout(4, TimeUnit.SECONDS)
                .build();

        Request request = new Request.Builder()
                .url(healthEndpoint)
                .get()
                .build();

        testClient.newCall(request).enqueue(new Callback() {
            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) {
                final long latency = System.currentTimeMillis() - startTime;
                final int code = response.code();
                response.close();

                if (response.isSuccessful()) {
                    mainHandler.post(() -> callback.onSuccess(code, latency));
                } else if (code == 404) {
                    // Fallback to /microgrid in case older backend is active
                    fallbackCheckMicrogrid(testClient, base, latency, mainHandler, callback);
                } else {
                    mainHandler.post(() -> callback.onSuccess(code, latency));
                }
            }

            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                // If health failed, try fallback to /microgrid before giving up
                fallbackCheckMicrogrid(testClient, base, 0, mainHandler, callback);
            }
        });
    }

    private static void fallbackCheckMicrogrid(OkHttpClient client, String base, long initialLatency, Handler handler, TestCallback callback) {
        final String fallbackUrl = base + "microgrid";
        final long startTime = System.currentTimeMillis();

        Request req = new Request.Builder().url(fallbackUrl).get().build();
        client.newCall(req).enqueue(new Callback() {
            @Override
            public void onResponse(@NonNull Call call, @NonNull Response response) {
                final long latency = initialLatency > 0 ? initialLatency : (System.currentTimeMillis() - startTime);
                final int code = response.code();
                response.close();
                handler.post(() -> callback.onSuccess(code, latency));
            }

            @Override
            public void onFailure(@NonNull Call call, @NonNull IOException e) {
                final String msg = e.getMessage() != null ? e.getMessage() : "Connection refused";
                handler.post(() -> callback.onError(msg));
            }
        });
    }
}
