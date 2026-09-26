package com.smartsolar.microgrid.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.models.EnergySlotDto;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * EnergySlotAdapter — RecyclerView adapter for displaying available energy slots in card views.
 * Component: Member 2 (Dilani) — Energy Slot UI Adapter
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class EnergySlotAdapter extends RecyclerView.Adapter<EnergySlotAdapter.SlotViewHolder> {

    public interface OnSlotClickListener {
        void onReserveClick(EnergySlotDto slot);
    }

    private final List<EnergySlotDto> slotList = new ArrayList<>();
    private final OnSlotClickListener listener;

    public EnergySlotAdapter(OnSlotClickListener listener) {
        this.listener = listener;
    }

    public void setSlots(List<EnergySlotDto> slots) {
        this.slotList.clear();
        if (slots != null) {
            this.slotList.addAll(slots);
        }
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public SlotViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_energy_slot, parent, false);
        return new SlotViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull SlotViewHolder holder, int position) {
        EnergySlotDto slot = slotList.get(position);
        holder.bind(slot, listener);
    }

    @Override
    public int getItemCount() {
        return slotList.size();
    }

    static class SlotViewHolder extends RecyclerView.ViewHolder {
        private final TextView tvSellerInfo;
        private final TextView tvSlotStatus;
        private final TextView tvNodeLocation;
        private final TextView tvEnergyAmount;
        private final TextView tvPricePerUnit;
        private final TextView tvDeliveryWindow;
        private final Button btnReserveSlot;

        public SlotViewHolder(@NonNull View itemView) {
            super(itemView);
            tvSellerInfo = itemView.findViewById(R.id.tvSellerInfo);
            tvSlotStatus = itemView.findViewById(R.id.tvSlotStatus);
            tvNodeLocation = itemView.findViewById(R.id.tvNodeLocation);
            tvEnergyAmount = itemView.findViewById(R.id.tvEnergyAmount);
            tvPricePerUnit = itemView.findViewById(R.id.tvPricePerUnit);
            tvDeliveryWindow = itemView.findViewById(R.id.tvDeliveryWindow);
            btnReserveSlot = itemView.findViewById(R.id.btnReserveSlot);
        }

        public void bind(EnergySlotDto slot, OnSlotClickListener listener) {
            tvSellerInfo.setText("Seller: " + slot.getProsumerId());
            tvSlotStatus.setText(slot.getStatus() != null ? slot.getStatus().toUpperCase() : "AVAILABLE");
            tvNodeLocation.setText("Station Node: " + (slot.getMicrogridNodeId() != null ? slot.getMicrogridNodeId() : "Grid"));
            tvEnergyAmount.setText(String.format(Locale.US, "%.1f kWh", slot.getEnergyAmount()));
            tvPricePerUnit.setText(String.format(Locale.US, "$%.2f / kWh", slot.getPricePerUnit()));

            String date = slot.getSlotDate() != null ? slot.getSlotDate().split("T")[0] : "Scheduled";
            String start = slot.getStartTime() != null ? slot.getStartTime() : "00:00";
            String end = slot.getEndTime() != null ? slot.getEndTime() : "00:00";
            tvDeliveryWindow.setText(String.format(Locale.US, "📅 %s | %s - %s", date, start, end));

            btnReserveSlot.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onReserveClick(slot);
                }
            });
        }
    }
}
