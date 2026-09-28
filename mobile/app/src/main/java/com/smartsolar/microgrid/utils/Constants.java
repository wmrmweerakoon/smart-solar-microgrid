package com.smartsolar.microgrid.utils;

/**
 * Constants — App-wide configuration constants, API base URLs, and role definitions.
 * Component: Phase 1 Foundation — Application Constants
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class Constants {
    // 10.0.2.2 maps to localhost from Android Emulator.
    // 127.0.0.1 maps to localhost when connected via USB cable with 'adb reverse tcp:5299 tcp:5299'.
    // 192.168.1.5 is the host PC's Wi-Fi network IP address.
    public static final String EMULATOR_BASE_URL = "http://10.0.2.2:5299/api/";
    public static final String USB_REVERSE_BASE_URL = "http://127.0.0.1:5299/api/";

    public static final String API_BASE_URL = isEmulator() ? EMULATOR_BASE_URL : USB_REVERSE_BASE_URL;

    public static boolean isEmulator() {
        return (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic"))
                || android.os.Build.FINGERPRINT.startsWith("generic")
                || android.os.Build.FINGERPRINT.startsWith("unknown")
                || android.os.Build.HARDWARE.contains("goldfish")
                || android.os.Build.HARDWARE.contains("ranchu")
                || android.os.Build.MODEL.contains("google_sdk")
                || android.os.Build.MODEL.contains("Emulator")
                || android.os.Build.MODEL.contains("Android SDK built for x86")
                || android.os.Build.MANUFACTURER.contains("Genymotion")
                || android.os.Build.PRODUCT.contains("sdk_google")
                || android.os.Build.PRODUCT.contains("google_sdk")
                || android.os.Build.PRODUCT.contains("sdk")
                || android.os.Build.PRODUCT.contains("sdk_x86")
                || android.os.Build.PRODUCT.contains("vbox86p")
                || android.os.Build.PRODUCT.contains("emulator")
                || android.os.Build.PRODUCT.contains("simulator");
    }

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
