package com.smartsolar.microgrid.api;

import android.content.Context;
import com.smartsolar.microgrid.utils.Constants;
import com.smartsolar.microgrid.utils.ServerConfig;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * ApiClient — Retrofit 2 client singleton configuring OkHttpClient, logging, and JWT interceptor.
 * Supports dynamic runtime backend switching across USB, Hotspot, and Wi-Fi networks.
 * Component: Phase 1 Foundation — Networking Layer
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ApiClient {
    private static Retrofit retrofit = null;

    public static synchronized ApiService getService(Context context) {
        if (retrofit == null) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(HttpLoggingInterceptor.Level.BODY);

            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(new TokenInterceptor(context.getApplicationContext()))
                    .addInterceptor(logging)
                    .connectTimeout(15, TimeUnit.SECONDS)
                    .readTimeout(15, TimeUnit.SECONDS)
                    .writeTimeout(15, TimeUnit.SECONDS)
                    .build();

            String baseUrl = ServerConfig.getBaseUrl(context);

            retrofit = new Retrofit.Builder()
                    .baseUrl(baseUrl)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build();
        }
        return retrofit.create(ApiService.class);
    }

    /**
     * Resets the Retrofit client instance so the next request uses the newly configured base URL.
     */
    public static synchronized void resetClient() {
        retrofit = null;
    }
}
