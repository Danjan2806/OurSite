package com.saas.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String type;
    private UUID userId;
    private String email;
    private String firstName;
    private String lastName;
    private String role;
}
