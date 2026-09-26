package com.smartsolar.microgrid.database;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import com.smartsolar.microgrid.utils.Constants;

/**
 * DatabaseHelper — SQLite OpenHelper managing users, cached reservations, and cached nodes tables.
 * Component: Phase 1 Foundation — Offline SQLite Database
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class DatabaseHelper extends SQLiteOpenHelper {

    public DatabaseHelper(Context context) {
        super(context, Constants.DB_NAME, null, Constants.DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // User session & profile cache
        db.execSQL("CREATE TABLE IF NOT EXISTS users (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "server_id TEXT," +
                "username TEXT UNIQUE," +
                "nic TEXT UNIQUE," +
                "full_name TEXT," +
                "email TEXT," +
                "phone TEXT," +
                "role TEXT," +
                "token TEXT," +
                "is_logged_in INTEGER DEFAULT 0," +
                "last_login TEXT" +
                ")");

        // Cached reservations for offline viewing
        db.execSQL("CREATE TABLE IF NOT EXISTS cached_reservations (" +
                "id TEXT PRIMARY KEY," +
                "energy_slot_id TEXT," +
                "buyer_prosumer_id TEXT," +
                "seller_prosumer_id TEXT," +
                "microgrid_node_id TEXT," +
                "energy_amount REAL," +
                "total_price REAL," +
                "status TEXT," +
                "reserved_at TEXT," +
                "notes TEXT," +
                "slot_date TEXT," +
                "start_time TEXT," +
                "end_time TEXT," +
                "last_synced TEXT" +
                ")");

        // Cached microgrid nodes for map & offline access
        db.execSQL("CREATE TABLE IF NOT EXISTS cached_nodes (" +
                "id TEXT PRIMARY KEY," +
                "node_name TEXT," +
                "location TEXT," +
                "capacity REAL," +
                "latitude REAL," +
                "longitude REAL," +
                "battery_storage_slots INTEGER," +
                "status TEXT," +
                "last_synced TEXT" +
                ")");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        db.execSQL("DROP TABLE IF EXISTS users");
        db.execSQL("DROP TABLE IF EXISTS cached_reservations");
        db.execSQL("DROP TABLE IF EXISTS cached_nodes");
        onCreate(db);
    }
}
