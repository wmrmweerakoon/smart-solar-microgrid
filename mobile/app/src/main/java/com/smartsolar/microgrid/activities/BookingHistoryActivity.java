package com.smartsolar.microgrid.activities;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.*;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.adapters.BookingAdapter;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.BookingDto;
import com.smartsolar.microgrid.utils.NetworkUtils;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookingHistoryActivity extends AppCompatActivity implements BookingAdapter.OnBookingClickListener {

    private RecyclerView rvBookings;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private TextView tvEmptyState;
    private Button btnBack, btnFilterAll, btnFilterCompleted, btnFilterCancelled;
    private BookingAdapter adapter;
    private final List<BookingDto> allHistory = new ArrayList<>();
    private String currentFilter = "ALL";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_booking_history);

        btnBack = findViewById(R.id.btnBack);
        btnFilterAll = findViewById(R.id.btnFilterAll);
        btnFilterCompleted = findViewById(R.id.btnFilterCompleted);
        btnFilterCancelled = findViewById(R.id.btnFilterCancelled);
        rvBookings = findViewById(R.id.rvBookings);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        tvEmptyState = findViewById(R.id.tvEmptyState);

        btnBack.setOnClickListener(v -> finish());

        rvBookings.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BookingAdapter(this);
        rvBookings.setAdapter(adapter);

        btnFilterAll.setOnClickListener(v -> applyFilter("ALL"));
        btnFilterCompleted.setOnClickListener(v -> applyFilter("Completed"));
        btnFilterCancelled.setOnClickListener(v -> applyFilter("Cancelled"));

        swipeRefresh.setOnRefreshListener(this::loadHistory);

        loadHistory();
    }

    private void loadHistory() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            swipeRefresh.setRefreshing(false);
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getBookingHistory().enqueue(new Callback<List<BookingDto>>() {
            @Override
            public void onResponse(Call<List<BookingDto>> call, Response<List<BookingDto>> response) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    allHistory.clear();
                    allHistory.addAll(response.body());
                    applyFilter(currentFilter);
                } else {
                    Toast.makeText(BookingHistoryActivity.this, "Could not fetch history", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<BookingDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                Toast.makeText(BookingHistoryActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void applyFilter(String filter) {
        currentFilter = filter;
        List<BookingDto> filtered = new ArrayList<>();
        for (BookingDto b : allHistory) {
            if ("ALL".equalsIgnoreCase(filter) || filter.equalsIgnoreCase(b.getStatus())) {
                filtered.add(b);
            }
        }
        adapter.setBookings(filtered);
        tvEmptyState.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
    }

    @Override
    public void onBookingClick(BookingDto booking) {
        Intent intent = new Intent(this, BookingDetailsActivity.class);
        intent.putExtra("EXTRA_BOOKING_ID", booking.getId());
        startActivity(intent);
    }
}
