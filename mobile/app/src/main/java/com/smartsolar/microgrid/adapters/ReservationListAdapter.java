package com.smartsolar.microgrid.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.models.ReservationDto;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * ReservationListAdapter — RecyclerView adapter for prosumer personal reservation list with status badges.
 * Component: Member 2 (Dilani) — Reservation List UI Adapter
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ReservationListAdapter extends RecyclerView.Adapter<ReservationListAdapter.ReservationViewHolder> {

    public interface OnReservationActionListener {
        void onEditClick(ReservationDto reservation);
        void onCancelClick(ReservationDto reservation);
    }

    private final List<ReservationDto> reservationList = new ArrayList<>();
    private final OnReservationActionListener listener;

    public ReservationListAdapter(OnReservationActionListener listener) {
        this.listener = listener;
    }

    public void setReservations(List<ReservationDto> reservations) {
        this.reservationList.clear();
        if (reservations != null) {
            this.reservationList.addAll(reservations);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ReservationViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_reservation, parent, false);
        return new ReservationViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ReservationViewHolder holder, int position) {
        ReservationDto res = reservationList.get(position);
        holder.bind(res, listener);
    }

    @Override
    public int getItemCount() {
        return reservationList.size();
    }

    static class ReservationViewHolder extends RecyclerView.ViewHolder {
        private final TextView tvResId;
        private final TextView tvResStatus;
        private final TextView tvEnergy;
        private final TextView tvTotalPrice;
        private final TextView tvDateSchedule;
        private final Button btnEditReservation;
        private final Button btnCancelReservation;

        public ReservationViewHolder(@NonNull View itemView) {
            super(itemView);
            tvResId = itemView.findViewById(R.id.tvResId);
            tvResStatus = itemView.findViewById(R.id.tvResStatus);
            tvEnergy = itemView.findViewById(R.id.tvEnergy);
            tvTotalPrice = itemView.findViewById(R.id.tvTotalPrice);
            tvDateSchedule = itemView.findViewById(R.id.tvDateSchedule);
            btnEditReservation = itemView.findViewById(R.id.btnEditReservation);
            btnCancelReservation = itemView.findViewById(R.id.btnCancelReservation);
        }

        public void bind(ReservationDto res, OnReservationActionListener listener) {
            String shortId = res.getId() != null && res.getId().length() > 8 ? res.getId().substring(0, 8) : res.getId();
            tvResId.setText("Res #" + shortId);
            tvResStatus.setText(res.getStatus() != null ? res.getStatus().toUpperCase() : "PENDING");
            tvEnergy.setText(String.format(Locale.US, "⚡ %.1f kWh", res.getEnergyAmount()));
            tvTotalPrice.setText(String.format(Locale.US, "$%.2f", res.getTotalPrice()));

            String date = res.getReservedAt() != null ? res.getReservedAt().split("T")[0] : "Recent";
            tvDateSchedule.setText("Booked: " + date + " | Seller: " + res.getSellerProsumerId());

            boolean isActionable = "Pending".equalsIgnoreCase(res.getStatus()) || "Confirmed".equalsIgnoreCase(res.getStatus());
            btnEditReservation.setVisibility(isActionable ? View.VISIBLE : View.GONE);
            btnCancelReservation.setVisibility(isActionable ? View.VISIBLE : View.GONE);

            btnEditReservation.setOnClickListener(v -> {
                if (listener != null) listener.onEditClick(res);
            });

            btnCancelReservation.setOnClickListener(v -> {
                if (listener != null) listener.onCancelClick(res);
            });
        }
    }
}
