package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.adapters.EnergySlotAdapter;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.EnergySlotDto;
import com.smartsolar.microgrid.api.models.MicrogridNodeDto;
import com.smartsolar.microgrid.utils.NetworkUtils;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * AvailableSlotsActivity — Browsing interface for available energy slots with station filter.
 * Component: Member 2 (Dilani) — Energy Slot Reservation
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class AvailableSlotsActivity extends AppCompatActivity implements EnergySlotAdapter.OnSlotClickListener {

    private EditText etSearchSlot;
    private Spinner spFilterNode;
    private RecyclerView rvEnergySlots;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private TextView tvEmptyState;
    private Button btnClose;

    private EnergySlotAdapter adapter;
    private final List<EnergySlotDto> allSlots = new ArrayList<>();
    private final List<MicrogridNodeDto> nodesList = new ArrayList<>();
    private ArrayAdapter<String> nodeSpinnerAdapter;
    private final List<String> nodeNames = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_available_slots);

        etSearchSlot = findViewById(R.id.etSearchSlot);
        spFilterNode = findViewById(R.id.spFilterNode);
        rvEnergySlots = findViewById(R.id.rvEnergySlots);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        tvEmptyState = findViewById(R.id.tvEmptyState);
        btnClose = findViewById(R.id.btnClose);

        btnClose.setOnClickListener(v -> finish());

        rvEnergySlots.setLayoutManager(new LinearLayoutManager(this));
        adapter = new EnergySlotAdapter(this);
        rvEnergySlots.setAdapter(adapter);

        nodeNames.add("All Grid Stations");
        nodeSpinnerAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, nodeNames);
        spFilterNode.setAdapter(nodeSpinnerAdapter);

        swipeRefresh.setOnRefreshListener(this::loadAvailableSlots);

        etSearchSlot.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) { filterSlots(); }
            @Override public void afterTextChanged(Editable s) {}
        });

        spFilterNode.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                filterSlots();
            }
            @Override public void onNothingSelected(AdapterView<?> parent) {}
        });

        loadNodes();
        loadAvailableSlots();
    }

    private void loadNodes() {
        ApiClient.getService(this).getAllNodes().enqueue(new Callback<List<MicrogridNodeDto>>() {
            @Override
            public void onResponse(Call<List<MicrogridNodeDto>> call, Response<List<MicrogridNodeDto>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    nodesList.clear();
                    nodesList.addAll(response.body());
                    nodeNames.clear();
                    nodeNames.add("All Grid Stations");
                    for (MicrogridNodeDto n : nodesList) {
                        nodeNames.add(n.getNodeName() + " (" + n.getLocation() + ")");
                    }
                    nodeSpinnerAdapter.notifyDataSetChanged();
                }
            }
            @Override public void onFailure(Call<List<MicrogridNodeDto>> call, Throwable t) {}
        });
    }

    private void loadAvailableSlots() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            swipeRefresh.setRefreshing(false);
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getSlotsByStatus("Available").enqueue(new Callback<List<EnergySlotDto>>() {
            @Override
            public void onResponse(Call<List<EnergySlotDto>> call, Response<List<EnergySlotDto>> response) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    allSlots.clear();
                    allSlots.addAll(response.body());
                    filterSlots();
                } else {
                    Toast.makeText(AvailableSlotsActivity.this, "Could not fetch energy slots", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<EnergySlotDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                Toast.makeText(AvailableSlotsActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void filterSlots() {
        String query = etSearchSlot.getText().toString().trim().toLowerCase();
        int selectedNodeIndex = spFilterNode.getSelectedItemPosition();
        String selectedNodeId = null;

        if (selectedNodeIndex > 0 && selectedNodeIndex - 1 < nodesList.size()) {
            selectedNodeId = nodesList.get(selectedNodeIndex - 1).getId();
        }

        List<EnergySlotDto> filtered = new ArrayList<>();
        for (EnergySlotDto s : allSlots) {
            boolean matchesSearch = query.isEmpty() ||
                    (s.getProsumerId() != null && s.getProsumerId().toLowerCase().contains(query)) ||
                    (s.getMicrogridNodeId() != null && s.getMicrogridNodeId().toLowerCase().contains(query));

            boolean matchesNode = selectedNodeId == null ||
                    (s.getMicrogridNodeId() != null && s.getMicrogridNodeId().equalsIgnoreCase(selectedNodeId));

            if (matchesSearch && matchesNode) {
                filtered.add(s);
            }
        }

        adapter.setSlots(filtered);
        tvEmptyState.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
    }

    @Override
    public void onReserveClick(EnergySlotDto slot) {
        Intent intent = new Intent(this, CreateReservationActivity.class);
        intent.putExtra("EXTRA_ENERGY_SLOT", slot);
        startActivity(intent);
    }
}
