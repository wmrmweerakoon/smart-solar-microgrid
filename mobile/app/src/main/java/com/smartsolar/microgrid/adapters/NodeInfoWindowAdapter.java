package com.smartsolar.microgrid.adapters;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;
import com.google.android.gms.maps.GoogleMap;
import com.google.android.gms.maps.model.Marker;
import com.smartsolar.microgrid.R;
import com.smartsolar.microgrid.api.models.MicrogridNodeDto;
import java.util.Locale;

/**
 * NodeInfoWindowAdapter — Custom InfoWindow renderer for Google Maps markers.
 * Displays station capacity, battery storage slots, and operational status in a styled popup.
 * Member 4 contribution: Google Maps API Integration (3 marks) + Nearby stations on map (5 marks).
 */
public class NodeInfoWindowAdapter implements GoogleMap.InfoWindowAdapter {

    private final View windowView;
    private final Context context;

    public NodeInfoWindowAdapter(Context context) {
        this.context = context;
        this.windowView = LayoutInflater.from(context).inflate(R.layout.layout_node_info_window, null);
    }

    @Override
    public View getInfoWindow(Marker marker) {
        render(marker, windowView);
        return windowView;
    }

    @Override
    public View getInfoContents(Marker marker) {
        return null;
    }

    /**
     * Populates custom info window elements using node metadata tagged to marker.
     */
    private void render(Marker marker, View view) {
        Object tag = marker.getTag();
        TextView tvNodeName = view.findViewById(R.id.tvInfoNodeName);
        TextView tvLocation = view.findViewById(R.id.tvInfoLocation);
        TextView tvCapacity = view.findViewById(R.id.tvInfoCapacity);
        TextView tvBatterySlots = view.findViewById(R.id.tvInfoBatterySlots);
        TextView tvStatus = view.findViewById(R.id.tvInfoStatus);

        if (tag instanceof MicrogridNodeDto) {
            MicrogridNodeDto node = (MicrogridNodeDto) tag;
            tvNodeName.setText(node.getNodeName());
            tvLocation.setText(node.getLocation());
            tvCapacity.setText(String.format(Locale.US, "⚡ %.1f kW", node.getCapacity()));
            tvBatterySlots.setText(String.format(Locale.US, "🔋 %d Slots", node.getBatteryStorageSlots()));

            String status = node.getStatus() != null ? node.getStatus() : "Active";
            tvStatus.setText(status.toUpperCase());
            if ("Active".equalsIgnoreCase(status)) {
                tvStatus.setTextColor(context.getResources().getColor(R.color.success));
            } else if ("Maintenance".equalsIgnoreCase(status)) {
                tvStatus.setTextColor(context.getResources().getColor(R.color.warning));
            } else {
                tvStatus.setTextColor(context.getResources().getColor(R.color.danger));
            }
        } else {
            tvNodeName.setText(marker.getTitle());
            tvLocation.setText(marker.getSnippet());
            tvCapacity.setText("");
            tvBatterySlots.setText("");
            tvStatus.setText("GRID NODE");
        }
    }
}
