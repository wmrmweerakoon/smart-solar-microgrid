package com.smartsolar.microgrid.activities;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.DeactivateRequest;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.NetworkUtils;
import okhttp3.ResponseBody;
import org.json.JSONObject;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DeactivateAccountActivity extends AppCompatActivity {

    private EditText etDeactivateReason;
    private Button btnConfirmDeactivate, btnCancel;
    private ProgressBar progressBar;
    private SessionManager sessionManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_deactivate_account);

        sessionManager = new SessionManager(this);

        etDeactivateReason = findViewById(R.id.etDeactivateReason);
        btnConfirmDeactivate = findViewById(R.id.btnConfirmDeactivate);
        btnCancel = findViewById(R.id.btnCancel);
        progressBar = findViewById(R.id.progressBar);

        btnCancel.setOnClickListener(v -> finish());
        btnConfirmDeactivate.setOnClickListener(v -> confirmDeactivationDialog());
    }

    private void confirmDeactivationDialog() {
        new AlertDialog.Builder(this)
                .setTitle("Are you sure?")
                .setMessage("Your prosumer account will be marked as INACTIVE. You will not be able to trade energy until reactivated by Backoffice.")
                .setPositiveButton("Yes, Deactivate", (dialog, which) -> performDeactivation())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void performDeactivation() {
        String nic = sessionManager.getNic();
        if (nic == null || nic.isEmpty()) nic = sessionManager.getUsername();

        String reason = etDeactivateReason.getText().toString().trim();
        if (reason.isEmpty()) reason = "Prosumer requested self-deactivation from mobile";

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        DeactivateRequest request = new DeactivateRequest(reason);
        ApiClient.getService(this).deactivateProsumer(nic, request).enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                setLoading(false);
                if (response.isSuccessful()) {
                    new AlertDialog.Builder(DeactivateAccountActivity.this)
                            .setTitle("Account Deactivated")
                            .setMessage("Your account has been deactivated successfully. You have been logged out.")
                            .setPositiveButton("OK", (dialog, which) -> {
                                sessionManager.clearSession();
                                Intent intent = new Intent(DeactivateAccountActivity.this, LoginActivity.class);
                                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                                startActivity(intent);
                                finish();
                            })
                            .setCancelable(false)
                            .show();
                } else {
                    String msg = "Could not deactivate account";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) msg = json.getString("message");
                        }
                    } catch (Exception ignored) {}

                    new AlertDialog.Builder(DeactivateAccountActivity.this)
                            .setTitle("Deactivation Blocked")
                            .setMessage(msg)
                            .setPositiveButton("Understand", null)
                            .show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                setLoading(false);
                Toast.makeText(DeactivateAccountActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnConfirmDeactivate.setEnabled(!isLoading);
        btnCancel.setEnabled(!isLoading);
    }
}
