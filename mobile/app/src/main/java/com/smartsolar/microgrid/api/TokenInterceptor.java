package com.smartsolar.microgrid.api;

import android.content.Context;
import com.smartsolar.microgrid.database.SessionManager;
import java.io.IOException;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

public class TokenInterceptor implements Interceptor {
    private final SessionManager sessionManager;

    public TokenInterceptor(Context context) {
        this.sessionManager = new SessionManager(context);
    }

    @Override
    public Response intercept(Chain chain) throws IOException {
        Request original = chain.request();
        String token = sessionManager.getToken();

        if (token != null && !token.isEmpty()) {
            Request.Builder builder = original.newBuilder()
                    .header("Authorization", "Bearer " + token)
                    .header("Accept", "application/json");
            return chain.proceed(builder.build());
        }

        return chain.proceed(original);
    }
}
