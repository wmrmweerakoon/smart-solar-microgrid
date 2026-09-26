package com.smartsolar.microgrid.api.models;

/**
 * LoginResponse — DTO for JWT authentication response containing token and user profile.
 * Component: Phase 1 Foundation — Auth API Model
 * Aligned with SE4040 Native Android Microgrid Architecture.
 */
public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private String fullName;
    private String userId;

    public String getToken() { return token; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
    public String getUserId() { return userId; }
}
