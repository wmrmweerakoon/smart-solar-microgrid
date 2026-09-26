package com.smartsolar.microgrid.database;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;

public class UserDao {
    private final DatabaseHelper dbHelper;

    public UserDao(Context context) {
        this.dbHelper = new DatabaseHelper(context);
    }

    public void saveOrUpdateUser(String serverId, String username, String nic, String fullName,
                                 String email, String phone, String role, String token) {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("server_id", serverId);
        values.put("username", username);
        values.put("nic", nic);
        values.put("full_name", fullName);
        values.put("email", email);
        values.put("phone", phone);
        values.put("role", role);
        values.put("token", token);
        values.put("is_logged_in", 1);
        values.put("last_login", String.valueOf(System.currentTimeMillis()));

        int rows = db.update("users", values, "username = ? OR nic = ?", new String[]{username, nic});
        if (rows == 0) {
            db.insert("users", null, values);
        }
    }

    public boolean hasLoggedInUser() {
        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.rawQuery("SELECT id FROM users WHERE is_logged_in = 1 LIMIT 1", null);
        boolean exists = cursor.moveToFirst();
        cursor.close();
        return exists;
    }

    public void clearUsers() {
        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("is_logged_in", 0);
        values.put("token", "");
        db.update("users", values, null, null);
    }
}
