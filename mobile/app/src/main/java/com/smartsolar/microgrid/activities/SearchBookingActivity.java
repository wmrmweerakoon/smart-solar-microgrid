package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.adapters.BookingAdapter;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.BookingDto;
import com.smartsolar.microgrid.api.models.MicrogridNodeDto;
import com.smartsolar.microgrid.utils.NetworkUtils;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class SearchBookingActivity extends AppCompatActivity implements BookingAdapter.OnBookingClickListener {

    private EditText etKeyword, etProsumerId;
    private Spinner spStatus, spNode;
    private Button btnSearch, btnReset, btnBack;
    private ProgressBar progressBar;
    private TextView tvEmptyState;
    private RecyclerView rvSearchResults;
    private BookingAdapter adapter;

    private final List<MicrogridNodeDto> nodesList = new ArrayList<>();
    private final List<String> nodeNames = new ArrayList<>();
    private ArrayAdapter<String> nodeAdapter;

    private final String[] statusOptions = {"All Statuses", "Booked", "Pending", "Completed", "Cancelled"};

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_search_booking);

        etKeyword = findViewById(R.id.etKeyword);
        etProsumerId = findViewById(R.id.etProsumerId);
        spStatus = findViewById(R.id.spStatus);
        spNode = findViewById(R.id.spNode);
        btnSearch = findViewById(R.id.btnSearch);
        btnReset = findViewById(R.id.btnReset);
        btnBack = findViewById(R.id.btnBack);
        progressBar = findViewById(R.id.progressBar);
        tvEmptyState = findViewById(R.id.tvEmptyState);
        rvSearchResults = findViewById(R.id.rvSearchResults);

        btnBack.setOnClickListener(v -> finish());

        rvSearchResults.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BookingAdapter(this);
        rvSearchResults.setAdapter(adapter);

        ArrayAdapter<String> statusAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, statusOptions);
        spStatus.setAdapter(statusAdapter);

        nodeNames.add("All Stations");
        nodeAdapter = new ArrayAdapter<>(this, android.R.layout.simple_spinner_dropdown_item, nodeNames);
        spNode.setAdapter(nodeAdapter);

        btnSearch.setOnClickListener(v -> executeSearch());
        btnReset.setOnClickListener(v -> resetFilters());

        loadNodes();
    }

    private void loadNodes() {
        ApiClient.getService(this).getAllNodes().enqueue(new Callback<List<MicrogridNodeDto>>() {
            @Override
            public void onResponse(Call<List<MicrogridNodeDto>> call, Response<List<MicrogridNodeDto>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    nodesList.clear();
                    nodesList.addAll(response.body());
                    nodeNames.clear();
                    nodeNames.add("All Stations");
                    for (MicrogridNodeDto n : nodesList) {
                        nodeNames.add(n.getNodeName());
                    }
                    nodeAdapter.notifyDataSetChanged();
                }
            }
            @Override public void onFailure(Call<List<MicrogridNodeDto>> call, Throwable t) {}
        });
    }

    private void executeSearch() {
        String keyword = etKeyword.getText().toString().trim();
        String prosumer = etProsumerId.getText().toString().trim();

        String status = spStatus.getSelectedItemPosition() > 0 ? (String) spStatus.getSelectedItem() : null;

        String nodeId = null;
        int nodePos = spNode.getSelectedItemPosition();
        if (nodePos > 0 && nodePos - 1 < nodesList.size()) {
            nodeId = nodesList.get(nodePos - 1).getId();
        }

        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).searchBookings(keyword.isEmpty() ? null : keyword, status, nodeId, prosumer.isEmpty() ? null : prosumer).enqueue(new Callback<List<BookingDto>>() {
            @Override
            public void onResponse(Call<List<BookingDto>> call, Response<List<BookingDto>> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    List<BookingDto> results = response.body();
                    adapter.setBookings(results);
                    tvEmptyState.setVisibility(results.isEmpty() ? View.VISIBLE : View.GONE);
                } else {
                    Toast.makeText(SearchBookingActivity.this, "Search failed", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<BookingDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(SearchBookingActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void resetFilters() {
        etKeyword.setText("");
        etProsumerId.setText("");
        spStatus.setSelection(0);
        spNode.setSelection(0);
        adapter.setBookings(new ArrayList<>());
        tvEmptyState.setVisibility(View.GONE);
    }

    @Override
    public void onBookingClick(BookingDto booking) {
        Intent intent = new Intent(this, BookingDetailsActivity.class);
        intent.putExtra("EXTRA_BOOKING_ID", booking.getId());
        startActivity(intent);
    }
}
