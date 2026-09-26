package com.smartsolar.microgrid.api.models;

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
