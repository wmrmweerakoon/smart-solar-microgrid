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
import com.smartsolar.microgrid.adapters.ReservationListAdapter;
import com.smartsolar.microgrid.api.ApiClient;
import com.smartsolar.microgrid.api.models.ReservationDto;
import com.smartsolar.microgrid.database.SessionManager;
import com.smartsolar.microgrid.utils.NetworkUtils;
import java.util.ArrayList;
import java.util.List;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

/**
 * MyReservationsActivity — Prosumer personal energy reservation management screen with status tabs.
 * Component: Member 3 (Nethum) — My Reservations Management
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class MyReservationsActivity extends AppCompatActivity implements ReservationListAdapter.OnReservationActionListener {

    private RecyclerView rvReservations;
    private SwipeRefreshLayout swipeRefresh;
    private ProgressBar progressBar;
    private TextView tvEmptyState;
    private Button btnBack, btnTabAll, btnTabPending, btnTabConfirmed, btnTabCancelled;
    private ReservationListAdapter adapter;
    private SessionManager sessionManager;

    private final List<ReservationDto> userReservations = new ArrayList<>();
    private String currentFilter = "ALL";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_my_reservations);

        sessionManager = new SessionManager(this);

        btnBack = findViewById(R.id.btnBack);
        btnTabAll = findViewById(R.id.btnTabAll);
        btnTabPending = findViewById(R.id.btnTabPending);
        btnTabConfirmed = findViewById(R.id.btnTabConfirmed);
        btnTabCancelled = findViewById(R.id.btnTabCancelled);
        rvReservations = findViewById(R.id.rvReservations);
        swipeRefresh = findViewById(R.id.swipeRefresh);
        progressBar = findViewById(R.id.progressBar);
        tvEmptyState = findViewById(R.id.tvEmptyState);

        btnBack.setOnClickListener(v -> finish());

        rvReservations.setLayoutManager(new LinearLayoutManager(this));
        adapter = new ReservationListAdapter(this);
        rvReservations.setAdapter(adapter);

        btnTabAll.setOnClickListener(v -> applyFilter("ALL"));
        btnTabPending.setOnClickListener(v -> applyFilter("Pending"));
        btnTabConfirmed.setOnClickListener(v -> applyFilter("Confirmed"));
        btnTabCancelled.setOnClickListener(v -> applyFilter("Cancelled"));

        swipeRefresh.setOnRefreshListener(this::loadMyReservations);

        loadMyReservations();
    }

    private void loadMyReservations() {
        if (!NetworkUtils.isNetworkAvailable(this)) {
            swipeRefresh.setRefreshing(false);
            Toast.makeText(this, "No internet connection", Toast.LENGTH_SHORT).show();
            return;
        }

        String myNic = sessionManager.getNic();
        if (myNic == null || myNic.isEmpty()) myNic = sessionManager.getUsername();
        final String currentNic = myNic;

        progressBar.setVisibility(View.VISIBLE);
        ApiClient.getService(this).getAllReservations().enqueue(new Callback<List<ReservationDto>>() {
            @Override
            public void onResponse(Call<List<ReservationDto>> call, Response<List<ReservationDto>> response) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                if (response.isSuccessful() && response.body() != null) {
                    userReservations.clear();
                    for (ReservationDto r : response.body()) {
                        if (currentNic.equalsIgnoreCase(r.getBuyerProsumerId()) || currentNic.equalsIgnoreCase(r.getSellerProsumerId())) {
                            userReservations.add(r);
                        }
                    }
                    applyFilter(currentFilter);
                } else {
                    Toast.makeText(MyReservationsActivity.this, "Could not fetch reservations", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<List<ReservationDto>> call, Throwable t) {
                progressBar.setVisibility(View.GONE);
                swipeRefresh.setRefreshing(false);
                Toast.makeText(MyReservationsActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void applyFilter(String filter) {
        currentFilter = filter;
        List<ReservationDto> filtered = new ArrayList<>();
        for (ReservationDto r : userReservations) {
            if ("ALL".equalsIgnoreCase(filter) || filter.equalsIgnoreCase(r.getStatus())) {
                filtered.add(r);
            }
        }
        adapter.setReservations(filtered);
        tvEmptyState.setVisibility(filtered.isEmpty() ? View.VISIBLE : View.GONE);
    }

    @Override
    public void onEditClick(ReservationDto reservation) {
        Intent intent = new Intent(this, UpdateReservationActivity.class);
        intent.putExtra("EXTRA_RESERVATION_ID", reservation.getId());
        startActivity(intent);
    }

    @Override
    public void onCancelClick(ReservationDto reservation) {
        Intent intent = new Intent(this, CancelReservationActivity.class);
        intent.putExtra("EXTRA_RESERVATION_ID", reservation.getId());
        startActivity(intent);
    }
}
