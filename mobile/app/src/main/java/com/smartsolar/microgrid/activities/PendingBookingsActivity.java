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
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * PendingBookingsActivity — Operator view for reviewing and confirming pending energy reservations.
 * Component: Member 3 (Nethum) — Pending Bookings Workflow
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class PendingBookingsActivity extends AppCompatActivity implements BookingAdapter.OnBookingClickListener {

    private RecyclerView rvBookings;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private TextView tvEmptyState;
    private Button btnBack;
    private BookingAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pending_bookings);

        btnBack = findViewById(R.id.btnBack);
        rvBookings = findViewById(R.id.rvBookings);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        tvEmptyState = findViewById(R.id.tvEmptyState);

        btnBack.setOnClickListener(v -> finish());

        rvBookings.setLayoutManager(new LinearLayoutManager(this));
        adapter = new BookingAdapter(this);
        rvBookings.setAdapter(adapter);

        swipeRefresh.setOnRefreshListener(this::loadPendingBookings);

        loadPendingBookings();
    }

    private void loadPendingBookings() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            swipeRefresh.setRefreshing(false);
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getPendingBookings().enqueue(new Callback<List<BookingDto>>() {
            @Override
            public void onResponse(Call<List<BookingDto>> call, Response<List<BookingDto>> response) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    List<BookingDto> list = response.body();
                    adapter.setBookings(list);
                    tvEmptyState.setVisibility(list.isEmpty() ? View.VISIBLE : View.GONE);
                } else {
                    Toast.makeText(PendingBookingsActivity.this, "Could not fetch pending bookings", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<BookingDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                Toast.makeText(PendingBookingsActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
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
