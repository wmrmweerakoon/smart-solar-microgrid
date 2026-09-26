package com.smartsolar.microgrid.database;

import android.content.Context;
import android.content.SharedPreferences;
import com.smartsolar.microgrid.utils.Constants;

/**
 * SessionManager — SharedPreferences session store for JWT token, active role, and NIC persistence.
 * Component: Phase 1 Foundation — User Session State
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class SessionManager {
    private final SharedPreferences prefs;
    private final SharedPreferences.Editor editor;
    private final Context context;

    public SessionManager(Context context) {
        this.context = context;
        this.prefs = context.getSharedPreferences(Constants.PREF_NAME, Context.MODE_PRIVATE);
        this.editor = prefs.edit();
    }

    public void saveSession(String token, String role, String username, String userId, String fullName, String nic) {
        editor.putString(Constants.KEY_TOKEN, token);
        editor.putString(Constants.KEY_USER_ROLE, role);
        editor.putString(Constants.KEY_USERNAME, username);
        editor.putString(Constants.KEY_USER_ID, userId);
        editor.putString(Constants.KEY_FULL_NAME, fullName);
        editor.putString(Constants.KEY_PROSUMER_NIC, nic);
        editor.apply();

        // Also save to SQLite User DAO
        UserDao userDao = new UserDao(context);
        userDao.saveOrUpdateUser(userId, username, nic, fullName, "", "", role, token);
    }

    public boolean isLoggedIn() {
        return getToken() != null && !getToken().isEmpty();
    }

    public String getToken() {
        return prefs.getString(Constants.KEY_TOKEN, null);
    }

    public String getRole() {
        return prefs.getString(Constants.KEY_USER_ROLE, Constants.ROLE_PROSUMER);
    }

    public String getUsername() {
        return prefs.getString(Constants.KEY_USERNAME, "");
    }

    public String getFullName() {
        return prefs.getString(Constants.KEY_FULL_NAME, "");
    }

    public String getNic() {
        return prefs.getString(Constants.KEY_PROSUMER_NIC, "");
    }

    public String getUserId() {
        return prefs.getString(Constants.KEY_USER_ID, "");
    }

    public void clearSession() {
        editor.clear();
        editor.apply();
        UserDao userDao = new UserDao(context);
        userDao.clearUsers();
    }
}
