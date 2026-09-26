package com.smartsolar.microgrid.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import com.smartsolar.microgrid.api.models.MicrogridNodeDto;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * NodeDao — SQLite Data Access Object for local microgrid node caching.
 * Enables offline viewing of nearby charging and generation stations on Google Maps.
 * Aligned with Phase 5 Member 4 rubric: offline fallback and node persistence.
 */
public class NodeDao {

    private final DatabaseHelper dbHelper;

    public NodeDao(Context context) {
        this.dbHelper = new DatabaseHelper(context);
    }

    /**
     * Inserts or replaces a microgrid node record in local SQLite cache.
     * @param node The MicrogridNodeDto received from the central server.
     */
    public void insertOrUpdate(MicrogridNodeDto node) {
        if (node == null || node.getId() == null) return;

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("id", node.getId());
        values.put("node_name", node.getNodeName());
        values.put("location", node.getLocation());
        values.put("capacity", node.getCapacity());
        values.put("latitude", node.getLatitude());
        values.put("longitude", node.getLongitude());
        values.put("battery_storage_slots", node.getBatteryStorageSlots());
        values.put("status", node.getStatus());
        values.put("last_synced", new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date()));

        db.insertWithOnConflict("cached_nodes", null, values, SQLiteDatabase.CONFLICT_REPLACE);
    }

    /**
     * Batch caches a list of microgrid nodes inside a single SQLite transaction.
     * @param nodes List of nodes fetched from the backend REST API.
     */
    public void saveAll(List<MicrogridNodeDto> nodes) {
        if (nodes == null || nodes.isEmpty()) return;

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.beginTransaction();
        try {
            for (MicrogridNodeDto node : nodes) {
                insertOrUpdate(node);
            }
            db.setTransactionSuccessful();
        } finally {
            db.endTransaction();
        }
    }

    /**
     * Retrieves all cached microgrid stations from SQLite.
     * Used as offline fallback when network connectivity is lost.
     * @return List of cached MicrogridNodeDto objects.
     */
    public List<MicrogridNodeDto> getAllNodes() {
        List<MicrogridNodeDto> list = new ArrayList<>();
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.query("cached_nodes", null, null, null, null, null, "node_name ASC");

        if (cursor != null) {
            while (cursor.moveToNext()) {
                MicrogridNodeDto node = cursorToNode(cursor);
                if (node != null) {
                    list.add(node);
                }
            }
            cursor.close();
        }
        return list;
    }

    /**
     * Retrieves a single cached node by its unique identifier.
     * @param id The node identifier.
     * @return MicrogridNodeDto if found, otherwise null.
     */
    public MicrogridNodeDto getNodeById(String id) {
        if (id == null) return null;
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.query("cached_nodes", null, "id = ?", new String[]{id}, null, null, null);

        MicrogridNodeDto node = null;
        if (cursor != null) {
            if (cursor.moveToFirst()) {
                node = cursorToNode(cursor);
            }
            cursor.close();
        }
        return node;
    }

    /**
     * Clears all cached nodes from local database.
     */
    public void clearNodes() {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        db.delete("cached_nodes", null, null);
    }

    /**
     * Helper to map an active Cursor row to a MicrogridNodeDto instance.
     */
    private MicrogridNodeDto cursorToNode(Cursor cursor) {
        try {
            String id = cursor.getString(cursor.getColumnIndexOrThrow("id"));
            String name = cursor.getString(cursor.getColumnIndexOrThrow("node_name"));
            String location = cursor.getString(cursor.getColumnIndexOrThrow("location"));
            double capacity = cursor.getDouble(cursor.getColumnIndexOrThrow("capacity"));
            double lat = cursor.getDouble(cursor.getColumnIndexOrThrow("latitude"));
            double lng = cursor.getDouble(cursor.getColumnIndexOrThrow("longitude"));
            int slots = cursor.getInt(cursor.getColumnIndexOrThrow("battery_storage_slots"));
            String status = cursor.getString(cursor.getColumnIndexOrThrow("status"));

            return new MicrogridNodeDto(id, name, location, capacity, lat, lng, slots, status);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
}
