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
import com.smartsolar.microgrid.api.models.DashboardStatsDto;
import com.smartsolar.microgrid.utils.NetworkUtils;
import java.util.Locale;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity implements BookingAdapter.OnBookingClickListener {

    private TextView tvApprovedFuture, tvPendingReservations, tvCurrentBookings, tvPendingBookings, tvCompletedBookings, tvTotalEnergy;
    private Button btnRefresh, btnViewCurrentBookings, btnViewPendingBookings, btnViewBookingHistory, btnSearchBookings;
    private ProgressBar progressBar;
    private RecyclerView rvRecentBookings;
    private BookingAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        tvApprovedFuture = findViewById(R.id.tvApprovedFuture);
        tvPendingReservations = findViewById(R.id.tvPendingReservations);
        tvCurrentBookings = findViewById(R.id.tvCurrentBookings);
        tvPendingBookings = findViewById(R.id.tvPendingBookings);
        tvCompletedBookings = findViewById(R.id.tvCompletedBookings);
        tvTotalEnergy = findViewById(R.id.tvTotalEnergy);

        btnRefresh = findViewById(R.id.btnRefresh);
        btnViewCurrentBookings = findViewById(R.id.btnViewCurrentBookings);
        btnViewPendingBookings = findViewById(R.id.btnViewPendingBookings);
        btnViewBookingHistory = findViewById(R.id.btnViewBookingHistory);
        btnSearchBookings = findViewById(R.id.btnSearchBookings);
        progressBar = findViewById(R.id.progressBar);

        rvRecentBookings = findViewById(R.id.rvRecentBookings);
        rvRecentBookings.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BookingAdapter(this);
        rvRecentBookings.setAdapter(adapter);

        btnRefresh.setOnClickListener(v -> loadStats());

        btnViewCurrentBookings.setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, CurrentBookingsActivity.class));
        });

        btnViewPendingBookings.setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, PendingBookingsActivity.class));
        });

        btnViewBookingHistory.setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, BookingHistoryActivity.class));
        });

        btnSearchBookings.setOnClickListener(v -> {
            startActivity(new Intent(DashboardActivity.this, SearchBookingActivity.class));
        });

        loadStats();
    }

    private void loadStats() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getDashboardStats().enqueue(new Callback<DashboardStatsDto>() {
            @Override
            public void onResponse(Call<DashboardStatsDto> call, Response<DashboardStatsDto> response) {
                progressBar.setVisibility(View.GONE);
                if (response.isSuccessful() && response.body() != null) {
                    DashboardStatsDto s = response.body();
                    tvApprovedFuture.setText(String.valueOf(s.getApprovedFutureReservations()));
                    tvPendingReservations.setText(String.valueOf(s.getPendingReservations()));
                    tvCurrentBookings.setText(String.valueOf(s.getCurrentBookings()));
                    tvPendingBookings.setText(String.valueOf(s.getPendingBookings()));
                    tvCompletedBookings.setText(String.valueOf(s.getCompletedBookings()));
                    tvTotalEnergy.setText(String.format(Locale.US, "%.1f kWh", s.getTotalEnergyTradedKWh()));

                    adapter.setBookings(s.getRecentBookings());
                } else {
                    Toast.makeText(DashboardActivity.this, "Could not fetch dashboard metrics", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<DashboardStatsDto> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                Toast.makeText(DashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onBookingClick(BookingDto booking) {
        Intent intent = new Intent(this, BookingDetailsActivity.class);
        intent.putExtra("EXTRA_BOOKING_ID", booking.getId());
        startActivity(intent);
    }
}
