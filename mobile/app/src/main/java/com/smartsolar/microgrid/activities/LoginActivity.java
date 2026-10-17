package com.smartsolar.microgrid.activities;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.LoginRequest;
import com.smartsolar.microgrid.api.models.LoginResponse;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.Constants;
import com.smartsolar.microgrid.utils.NetworkUtils;
import com.smartsolar.microgrid.utils.ServerConfig;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * LoginActivity — Authentication screen for Prosumers and Grid Operators.
 * Component: Member 1 (Ruvishan) — Authentication & Session Management
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class LoginActivity extends AppCompatActivity {

    private EditText etUsername;
    private EditText etPassword;
    private Button btnSignIn;
    private Button btnRegister;
    private ProgressBar progressBar;
    private ImageButton btnServerSettings;
    private TextView tvCurrentServerBadge;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        sessionManager = new SessionManager(this);

        etUsername = findViewById(R.id.etUsername);
        etPassword = findViewById(R.id.etPassword);
        btnSignIn = findViewById(R.id.btnSignIn);
        btnRegister = findViewById(R.id.btnRegister);
        progressBar = findViewById(R.id.progressBar);
        btnServerSettings = findViewById(R.id.btnServerSettings);
        tvCurrentServerBadge = findViewById(R.id.tvCurrentServerBadge);

        updateServerBadge();

        btnServerSettings.setOnClickListener(v -> showServerSettingsDialog());
        tvCurrentServerBadge.setOnClickListener(v -> showServerSettingsDialog());

        btnSignIn.setOnClickListener(v -> performLogin());

        btnRegister.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
            startActivity(intent);
        });
    }

    private void updateServerBadge() {
        if (tvCurrentServerBadge != null) {
            String baseUrl = ServerConfig.getBaseUrl(this);
            String display = baseUrl.replace("http://", "").replace("https://", "");
            if (display.endsWith("/")) {
                display = display.substring(0, display.length() - 1);
            }
            tvCurrentServerBadge.setText("⚡ " + display);
        }
    }

    private void showServerSettingsDialog() {
        View dialogView = LayoutInflater.from(this).inflate(R.layout.dialog_server_settings, null);
        AlertDialog dialog = new AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create();

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawable(new ColorDrawable(Color.TRANSPARENT));
        }

        EditText etServerUrl = dialogView.findViewById(R.id.etServerUrl);
        TextView tvFormattedPreview = dialogView.findViewById(R.id.tvFormattedPreview);
        TextView tvConnectionStatus = dialogView.findViewById(R.id.tvConnectionStatus);
        ProgressBar pbTesting = dialogView.findViewById(R.id.pbTesting);
        Button btnTestConnection = dialogView.findViewById(R.id.btnTestConnection);
        Button btnPresetUsb5299 = dialogView.findViewById(R.id.btnPresetUsb5299);
        Button btnPresetUsb8000 = dialogView.findViewById(R.id.btnPresetUsb8000);
        Button btnPresetWifi = dialogView.findViewById(R.id.btnPresetWifi);
        Button btnPresetEmulator = dialogView.findViewById(R.id.btnPresetEmulator);
        Button btnSaveServerUrl = dialogView.findViewById(R.id.btnSaveServerUrl);
        Button btnCancelSettings = dialogView.findViewById(R.id.btnCancelSettings);
        ImageButton btnCloseDialog = dialogView.findViewById(R.id.btnCloseDialog);

        String currentUrl = ServerConfig.getBaseUrl(this);
        etServerUrl.setText(currentUrl);
        tvFormattedPreview.setText("Formats to: " + ServerConfig.formatUrl(currentUrl));

        etServerUrl.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String formatted = ServerConfig.formatUrl(s.toString());
                tvFormattedPreview.setText("Formats to: " + formatted);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        btnPresetUsb5299.setOnClickListener(v -> etServerUrl.setText("127.0.0.1:5299"));
        btnPresetUsb8000.setOnClickListener(v -> etServerUrl.setText("127.0.0.1:8000"));
        btnPresetEmulator.setOnClickListener(v -> etServerUrl.setText("10.0.2.2:5299"));
        btnPresetWifi.setOnClickListener(v -> {
            etServerUrl.setText("192.168.1.5:5299");
            etServerUrl.setSelection(etServerUrl.getText().length());
        });

        btnTestConnection.setOnClickListener(v -> {
            String input = etServerUrl.getText().toString();
            pbTesting.setVisibility(View.VISIBLE);
            btnTestConnection.setEnabled(false);
            tvConnectionStatus.setText("● Testing connection to " + ServerConfig.formatUrl(input) + "health...");
            tvConnectionStatus.setTextColor(ContextCompat.getColor(this, R.color.text_secondary));

            ServerConfig.testConnection(input, new ServerConfig.TestCallback() {
                @Override
                public void onSuccess(int httpCode, long latencyMs) {
                    pbTesting.setVisibility(View.GONE);
                    btnTestConnection.setEnabled(true);
                    tvConnectionStatus.setText("● Connected! (HTTP " + httpCode + " OK - " + latencyMs + "ms)");
                    tvConnectionStatus.setTextColor(ContextCompat.getColor(LoginActivity.this, R.color.success));
                }

                @Override
                public void onError(String errorMessage) {
                    pbTesting.setVisibility(View.GONE);
                    btnTestConnection.setEnabled(true);
                    tvConnectionStatus.setText("● Connection Failed:\n" + errorMessage + "\n(Tip: Run 'adb reverse tcp:5299 tcp:5299' if using USB)");
                    tvConnectionStatus.setTextColor(ContextCompat.getColor(LoginActivity.this, R.color.danger));
                }
            });
        });

        btnSaveServerUrl.setOnClickListener(v -> {
            String input = etServerUrl.getText().toString().trim();
            ServerConfig.saveBaseUrl(this, input);
            updateServerBadge();
            Toast.makeText(this, "Server URL updated!", Toast.LENGTH_SHORT).show();
            dialog.dismiss();
        });

        btnCancelSettings.setOnClickListener(v -> dialog.dismiss());
        btnCloseDialog.setOnClickListener(v -> dialog.dismiss());

        dialog.show();
    }

    private void performLogin() {
        String username = etUsername.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (username.isEmpty()) {
            etUsername.setError("Please enter your Username or NIC");
            etUsername.requestFocus();
            return;
        }

        if (password.isEmpty()) {
            etPassword.setError("Please enter your password");
            etPassword.requestFocus();
            return;
        }

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection. Please check your network.", Toast.LENGTH_LONG).show();
            return;
        }

        setLoading(true);

        LoginRequest request = new LoginRequest(username, password);
        ApiClient.getService(this).login(request).enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse data = response.body();
                    String role = data.getRole() != null ? data.getRole() : Constants.ROLE_PROSUMER;
                    String nic = Constants.ROLE_PROSUMER.equalsIgnoreCase(role) ? data.getUsername() : "";

                    sessionManager.saveSession(
                            data.getToken(),
                            role,
                            data.getUsername(),
                            data.getUserId(),
                            data.getFullName(),
                            nic
                    );

                    Toast.makeText(LoginActivity.this, "Welcome, " + data.getFullName() + "!", Toast.LENGTH_SHORT).show();

                    if (Constants.ROLE_OPERATOR.equalsIgnoreCase(role) || Constants.ROLE_BACKOFFICE.equalsIgnoreCase(role)) {
                        startActivity(new Intent(LoginActivity.this, OperatorHomeActivity.class));
                    } else {
                        startActivity(new Intent(LoginActivity.this, ProsumerHomeActivity.class));
                    }
                    finish();
                } else {
                    String errorMsg = "Invalid credentials";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) errorMsg = json.getString("message");
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(LoginActivity.this, errorMsg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                setLoading(false);
                Toast.makeText(LoginActivity.this, "Connection failed: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnSignIn.setEnabled(!isLoading);
        btnRegister.setEnabled(!isLoading);
    }
}
