package com.smartsolar.microgrid.utils;

public class Constants {
    // 10.0.2.2 maps to localhost from Android Emulator.
    // If running on a physical Android device, change this to your laptop's Wi-Fi IP address.
    public static final String API_BASE_URL = "http://10.0.2.2:5299/api/";

    // SQLite
    public static final String DB_NAME = "smart_solar_microgrid.db";
    public static final int DB_VERSION = 1;

    // Roles
    public static final String ROLE_PROSUMER = "Prosumer";
    public static final String ROLE_OPERATOR = "GridOperator";
    public static final String ROLE_BACKOFFICE = "Backoffice";

    // SharedPreferences
    public static final String PREF_NAME = "solar_session";
    public static final String KEY_TOKEN = "jwt_token";
    public static final String KEY_USER_ROLE = "user_role";
    public static final String KEY_USER_ID = "user_id";
    public static final String KEY_USERNAME = "username";
    public static final String KEY_FULL_NAME = "full_name";
    public static final String KEY_PROSUMER_NIC = "prosumer_nic";
}
