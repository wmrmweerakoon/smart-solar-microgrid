package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.LoginRequest;
import com.smartsolar.microgrid.api.models.LoginResponse;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.Constants;
import com.smartsolar.microgrid.utils.NetworkUtils;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText etUsername;
    private EditText etPassword;
    private Button btnSignIn;
    private Button btnRegister;
    private ProgressBar progressBar;
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

        btnSignIn.setOnClickListener(v -> performLogin());

        btnRegister.setOnClickListener(v -> {
            Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
            startActivity(intent);
        });
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
