package com.smartsolar.microgrid.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.models.BookingDto;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class BookingAdapter extends RecyclerView.Adapter<BookingAdapter.BookingViewHolder> {

    public interface OnBookingClickListener {
        void onBookingClick(BookingDto booking);
    }

    private final List<BookingDto> bookingList = new ArrayList<>();
    private final OnBookingClickListener listener;

    public BookingAdapter(OnBookingClickListener listener) {
        this.listener = listener;
    }

    public void setBookings(List<BookingDto> list) {
        this.bookingList.clear();
        if (list != null) {
            this.bookingList.addAll(list);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public BookingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_booking, parent, false);
        return new BookingViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull BookingViewHolder holder, int position) {
        BookingDto b = bookingList.get(position);
        holder.bind(b, listener);
    }

    @Override
    public int getItemCount() {
        return bookingList.size();
    }

    static class BookingViewHolder extends RecyclerView.ViewHolder {
        private final TextView tvBookingRef, tvBookingStatus, tvTradeParties, tvNodeLocation, tvEnergyAmount, tvTotalPrice, tvScheduleTime;

        public BookingViewHolder(@NonNull View itemView) {
            super(itemView);
            tvBookingRef = itemView.findViewById(R.id.tvBookingRef);
            tvBookingStatus = itemView.findViewById(R.id.tvBookingStatus);
            tvTradeParties = itemView.findViewById(R.id.tvTradeParties);
            tvNodeLocation = itemView.findViewById(R.id.tvNodeLocation);
            tvEnergyAmount = itemView.findViewById(R.id.tvEnergyAmount);
            tvTotalPrice = itemView.findViewById(R.id.tvTotalPrice);
            tvScheduleTime = itemView.findViewById(R.id.tvScheduleTime);
        }

        public void bind(BookingDto b, OnBookingClickListener listener) {
            String shortId = b.getId() != null && b.getId().length() > 8 ? b.getId().substring(0, 8) : b.getId();
            tvBookingRef.setText("Ref #" + shortId);
            tvBookingStatus.setText(b.getStatus().toUpperCase());

            String seller = b.getSellerName() != null ? b.getSellerName() : b.getSellerProsumerId();
            String buyer = b.getBuyerName() != null ? b.getBuyerName() : b.getBuyerProsumerId();
            tvTradeParties.setText(seller + " ➔ " + buyer);

            tvNodeLocation.setText("Station: " + b.getMicrogridNodeName());
            tvEnergyAmount.setText(String.format(Locale.US, "⚡ %.1f kWh", b.getEnergyAmount()));
            tvTotalPrice.setText(String.format(Locale.US, "$%.2f", b.getTotalPrice()));

            String date = b.getSlotDate() != null ? b.getSlotDate().split("T")[0] : "Date TBD";
            String start = b.getStartTime() != null ? b.getStartTime() : "00:00";
            String end = b.getEndTime() != null ? b.getEndTime() : "00:00";
            tvScheduleTime.setText(String.format("📅 %s | %s - %s", date, start, end));

            itemView.setOnClickListener(v -> {
                if (listener != null) listener.onBookingClick(b);
            });
        }
    }
}
