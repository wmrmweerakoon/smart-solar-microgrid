package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.MicrogridNodeDto;
import com.smartsolar.microgrid.api.models.ProsumerDto;
import com.smartsolar.microgrid.api.models.UpdateProsumerRequest;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.NetworkUtils;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * ProfileActivity — Prosumer profile viewing and profile update interface.
 * Component: Member 1 (Ruvishan) — Account Management
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ProfileActivity extends AppCompatActivity {

    private TextView tvDisplayName, tvDisplayNic, tvStatusBadge;
    private EditText etEditName, etEditEmail, etEditPhone, etEditAddress, etEditCapacity;
    private Spinner spEditNode;
    private Button btnSaveChanges, btnDeactivateAccount, btnBack;
    private ProgressBar progressBar;
    private SessionManager sessionManager;
    private final List<MicrogridNodeDto> nodeList = new ArrayList<>();
    private ArrayAdapter<MicrogridNodeDto> nodeAdapter;
    private String currentSelectedNodeId = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        sessionManager = new SessionManager(this);

        tvDisplayName = findViewById(R.id.tvDisplayName);
        tvDisplayNic = findViewById(R.id.tvDisplayNic);
        tvStatusBadge = findViewById(R.id.tvStatusBadge);
        etEditName = findViewById(R.id.etEditName);
        etEditEmail = findViewById(R.id.etEditEmail);
        etEditPhone = findViewById(R.id.etEditPhone);
        etEditAddress = findViewById(R.id.etEditAddress);
        etEditCapacity = findViewById(R.id.etEditCapacity);
        spEditNode = findViewById(R.id.spEditNode);
        btnSaveChanges = findViewById(R.id.btnSaveChanges);
        btnDeactivateAccount = findViewById(R.id.btnDeactivateAccount);
        btnBack = findViewById(R.id.btnBack);
        progressBar = findViewById(R.id.progressBar);

        nodeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, nodeList);
        spEditNode.setAdapter(nodeAdapter);

        btnBack.setOnClickListener(v -> finish());
        btnSaveChanges.setOnClickListener(v -> saveProfileChanges());
        btnDeactivateAccount.setOnClickListener(v -> {
            Intent intent = new Intent(ProfileActivity.this, DeactivateAccountActivity.class);
            startActivity(intent);
        });

        loadNodesAndProfile();
    }

    private void loadNodesAndProfile() {
        setLoading(true);
        ApiClient.getService(this).getAllNodes().enqueue(new Callback<List<MicrogridNodeDto>>() {
            @Override
            public void onResponse(Call<List<MicrogridNodeDto>> call, Response<List<MicrogridNodeDto>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    nodeList.clear();
                    nodeList.addAll(response.body());
                    nodeAdapter.notifyDataSetChanged();
                }
                loadProsumerProfile();
            }

            @Override
            public void onFailure(Call<List<MicrogridNodeDto>> call, Throwable t) {
                loadProsumerProfile();
            }
        });
    }

    private void loadProsumerProfile() {
        String nic = sessionManager.getNic();
        if (nic == null || nic.isEmpty()) nic = sessionManager.getUsername();

        ApiClient.getService(this).getProsumerByNic(nic).enqueue(new Callback<ProsumerDto>() {
            @Override
            public void onResponse(Call<ProsumerDto> call, Response<ProsumerDto> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    ProsumerDto p = response.body();
                    tvDisplayName.setText(p.getName());
                    tvDisplayNic.setText("NIC: " + p.getNic());
                    tvStatusBadge.setText(p.getStatus() != null ? p.getStatus().toUpperCase() : "ACTIVE");

                    etEditName.setText(p.getName());
                    etEditEmail.setText(p.getEmail());
                    etEditPhone.setText(p.getPhone());
                    etEditAddress.setText(p.getAddress());
                    etEditCapacity.setText(String.valueOf(p.getSolarCapacity()));

                    currentSelectedNodeId = p.getMicrogridNodeId();
                    selectNodeInSpinner(currentSelectedNodeId);
                } else {
                    Toast.makeText(ProfileActivity.this, "Could not load profile details", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ProsumerDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(ProfileActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void selectNodeInSpinner(String nodeId) {
        if (nodeId == null) return;
        for (int i = 0; i < nodeList.size(); i++) {
            if (nodeId.equals(nodeList.get(i).getId())) {
                spEditNode.setSelection(i);
                break;
            }
        }
    }

    private void saveProfileChanges() {
        String nic = sessionManager.getNic();
        if (nic == null || nic.isEmpty()) nic = sessionManager.getUsername();

        String name = etEditName.getText().toString().trim();
        String email = etEditEmail.getText().toString().trim();
        String phone = etEditPhone.getText().toString().trim();
        String address = etEditAddress.getText().toString().trim();
        String capacityStr = etEditCapacity.getText().toString().trim();

        if (name.isEmpty()) {
            etEditName.setError("Name is required");
            return;
        }

        if (email.isEmpty()) {
            etEditEmail.setError("Email is required");
            return;
        }

        double capacity;
        try {
            capacity = Double.parseDouble(capacityStr);
        } catch (NumberFormatException e) {
            etEditCapacity.setError("Invalid capacity");
            return;
        }

        String nodeId = currentSelectedNodeId;
        if (spEditNode.getSelectedItem() != null) {
            nodeId = ((MicrogridNodeDto) spEditNode.getSelectedItem()).getId();
        }

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoading(true);

        UpdateProsumerRequest request = new UpdateProsumerRequest(name, email, phone, address, nodeId, capacity);
        ApiClient.getService(this).updateProsumer(nic, request).enqueue(new Callback<ProsumerDto>() {
            @Override
            public void onResponse(Call<ProsumerDto> call, Response<ProsumerDto> response) {
                setLoading(false);
                if (response.isSuccessful() && response.body() != null) {
                    Toast.makeText(ProfileActivity.this, "Profile updated successfully!", Toast.LENGTH_SHORT).show();
                    tvDisplayName.setText(name);
                    sessionManager.saveSession(
                            sessionManager.getToken(),
                            sessionManager.getRole(),
                            sessionManager.getUsername(),
                            sessionManager.getUserId(),
                            name,
                            sessionManager.getNic()
                    );
                } else {
                    String msg = "Update failed";
                    try {
                        if (response.errorBody() != null) {
                            JSONObject json = new JSONObject(response.errorBody().string());
                            if (json.has("message")) msg = json.getString("message");
                        }
                    } catch (Exception ignored) {}
                    Toast.makeText(ProfileActivity.this, msg, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ProsumerDto> call, Throwable t) {
                setLoading(false);
                Toast.makeText(ProfileActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void setLoading(boolean isLoading) {
        progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        btnSaveChanges.setEnabled(!isLoading);
        btnDeactivateAccount.setEnabled(!isLoading);
    }
}
