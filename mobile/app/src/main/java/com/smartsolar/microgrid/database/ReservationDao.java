package com.smartsolar.microgrid.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.smartsolar.microgrid.api.models.ReservationDto;
import java.util.ArrayList;
import java.util.List;

/**
 * ReservationDao — SQLite DAO for offline caching and querying of reservations.
 * Component: Member 2 (Dilani) — Offline SQLite Reservation DAO
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class ReservationDao {
    private final DatabaseHelper dbHelper;

    public ReservationDao(Context context) {
        this.dbHelper = new DatabaseHelper(context);
    }

    public void cacheReservation(ReservationDto res) {
        if (res == null || res.getId() == null) return;
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id", res.getId());
        values.put("energy_slot_id", res.getEnergySlotId());
        values.put("buyer_prosumer_id", res.getBuyerProsumerId());
        values.put("seller_prosumer_id", res.getSellerProsumerId());
        values.put("microgrid_node_id", res.getMicrogridNodeId());
        values.put("energy_amount", res.getEnergyAmount());
        values.put("total_price", res.getTotalPrice());
        values.put("status", res.getStatus());
        values.put("reserved_at", res.getReservedAt());
        values.put("notes", res.getNotes());
        values.put("last_synced", String.valueOf(System.currentTimeMillis()));

        int rows = db.update("cached_reservations", values, "id = ?", new String[]{res.getId()});
        if (rows == 0) {
            db.insert("cached_reservations", null, values);
        }
    }

    public void cacheReservationsList(List<ReservationDto> list) {
        if (list == null) return;
        for (ReservationDto res : list) {
            cacheReservation(res);
        }
    }

    public List<ReservationDto> getCachedReservations() {
        List<ReservationDto> result = new ArrayList<>();
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT id, energy_slot_id, buyer_prosumer_id, seller_prosumer_id, microgrid_node_id, energy_amount, total_price, status, reserved_at, notes FROM cached_reservations ORDER BY reserved_at DESC", null);

        if (cursor.moveToFirst()) {
            do {
                // Return cached records if needed
            } while (cursor.moveToNext());
        }
        cursor.close();
        return result;
    }
}
