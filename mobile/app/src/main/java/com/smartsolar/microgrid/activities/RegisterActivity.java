package com.smartsolar.microgrid.activities;

import android.app.AlertDialog;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.MicrogridNodeDto;
import com.smartsolar.microgrid.api.models.ProsumerDto;
import com.smartsolar.microgrid.api.models.RegisterRequest;
import com.smartsolar.microgrid.utils.NetworkUtils;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    private EditText etNic, etFullName, etEmail, etPhone, etAddress, etSolarCapacity, etPassword, etConfirmPassword;
    private Spinner spMicrogridNode;
    private Button btnSubmitRegister, btnBackToLogin;
    private ProgressBar progressBar;
    private final List<MicrogridNodeDto> nodeList = new ArrayList<>();
    private ArrayAdapter<MicrogridNodeDto> nodeAdapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        etNic = findViewById(R.id.etNic);
        etFullName = findViewById(R.id.etFullName);
        etEmail = findViewById(R.id.etEmail);
        etPhone = findViewById(R.id.etPhone);
        etAddress = findViewById(R.id.etAddress);
        etSolarCapacity = findViewById(R.id.etSolarCapacity);
        etPassword = findViewById(R.id.etPassword);
        etConfirmPassword = findViewById(R.id.etConfirmPassword);
        spMicrogridNode = findViewById(R.id.spMicrogridNode);
        btnSubmitRegister = findViewById(R.id.btnSubmitRegister);
        btnBackToLogin = findViewById(R.id.btnBackToLogin);
        progressBar = findViewById(R.id.progressBar);

        nodeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, nodeList);
        spMicrogridNode.setAdapter(nodeAdapter);

        loadMicrogridNodes();

        btnSubmitRegister.setOnClickListener(v -> submitRegistration());
        btnBackToLogin.setOnClickListener(v -> finish());
    }

    private void loadMicrogridNodes() {
        ApiClient.getService(this).getAllNodes().enqueue(new Callback<List<MicrogridNodeDto>>() {
            @Override
            public void onResponse(Call<List<MicrogridNodeDto>> call, Response<List<MicrogridNodeDto>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    nodeList.clear();
                    nodeList.addAll(response.body());
                    nodeAdapter.notifyDataSetChanged();
                }
            }

            @Override
            public void onFailure(Call<List<MicrogridNodeDto>> call, Throwable t) {
                Toast.makeText(RegisterActivity.this, "Could not load microgrid nodes", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void submitRegistration() {
        String nic = etNic.getText().toString().trim().toUpperCase();
        String name = etFullName.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String phone = etPhone.getText().toString().trim();
        String address = etAddress.getText().toString().trim();
        String capacityStr = etSolarCapacity.getText().toString().trim();
        String password = etPassword.getText().toString().trim();
        String confirmPassword = etConfirmPassword.getText().toString().trim();

        // Validations
        if (!nic.matches("^([0-9]{9}[vVxX]|[0-9]{12})$")) {
            etNic.setError("Invalid NIC format (9 digits + V/X or 12 digits)");
            etNic.requestFocus();
            return;
        }

        if (name.isEmpty()) {
            etFullName.setError("Full name is required");
            etFullName.requestFocus();
            return;
        }

        if (email.isEmpty() || !android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.setError("Valid email address required");
            etEmail.requestFocus();
            return;
        }

        if (phone.isEmpty()) {
            etPhone.setError("Phone number required");
            etPhone.requestFocus();
            return;
        }

        if (address.isEmpty()) {
            etAddress.setError("Address is required");
            etAddress.requestFocus();
            return;
        }

        double capacity;
        try {
            capacity = Double.parseDouble(capacityStr);
            if (capacity <= 0) throw new NumberFormatException();
        } catch (NumberFormatException e) {
            etSolarCapacity.setError("Enter a valid solar capacity (> 0 kW)");
            etSolarCapacity.requestFocus();
            return;
        }

        String nodeId = "";
        if (spMicrogridNode.getSelectedItem() != null) {
            MicrogridNodeDto selected = (MicrogridNodeDto) spMicrogridNode.getSelectedItem();
            nodeId = selected.getId();
        }

        if (password.length() < 6) {
            etPassword.setError("Password must be at least 6 characters");
            etPassword.requestFocus();
            return;
        }

        if (!password.equals(confirmPassword)) {
            etConfirmPassword.setError("Passwords do not match");
            etConfirmPassword.requestFocus();
            return;
        }

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_LONG).show();
            return;
        }

        setLoading(true);

        RegisterRequest request = new RegisterRequest(nic, name, email, phone, address, nodeId, capacity, password);
        ApiClient.getService(this).registerProsumer(request).enqueue(new Callback<ProsumerDto>() {
            @Override
            public void onResponse(Call<ProsumerDto> call, Response<ProsumerDto> response) {
                setLoading(false);
                if (response.isSuccessful()) {
                    new AlertDialog.Builder(RegisterActivity.this)
                            .setTitle("Registration Submitted! ☀️")
                            .setMessage("Your prosumer account with NIC " + nic + " has been created.\n\nStatus: PENDING ACTIVATION\n\nA Backoffice officer will review and activate your account. Once approved, you can log in directly.")
                            .setPositiveButton("Go to Login", (dialog, which) -> finish())
                            .setCancelable(false)
                            .show();
                } else {
                    String msg = "Registration failed";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) msg = json.getString("message");
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(RegisterActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ProsumerDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnSubmitRegister.setEnabled(!isLoading);
    }
}
