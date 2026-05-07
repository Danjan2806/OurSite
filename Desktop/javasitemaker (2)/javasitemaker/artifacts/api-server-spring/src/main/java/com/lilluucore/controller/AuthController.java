package com.lilluucore.controller;

import com.lilluucore.dto.ApiError;
import com.lilluucore.dto.LoginRequest;
import com.lilluucore.dto.RegisterRequest;
import com.lilluucore.entity.UserSettings;
import com.lilluucore.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/auth/me")
    public ResponseEntity<?> getMe(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(authService.getMe(userId));
    }

    @GetMapping("/auth/settings")
    public ResponseEntity<?> getSettings(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(authService.getSettings(userId));
    }

    @PutMapping("/auth/settings")
    public ResponseEntity<?> updateSettings(@AuthenticationPrincipal String userId,
                                             @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(authService.updateSettings(userId, body));
    }

    @GetMapping("/auth/seo-settings")
    public ResponseEntity<?> getSeoSettings(@AuthenticationPrincipal String userId) {
        UserSettings s = authService.getSettings(userId);
        try {
            return ResponseEntity.ok(
                    s.getSeoSettings() != null && !s.getSeoSettings().isBlank()
                            ? new com.fasterxml.jackson.databind.ObjectMapper().readValue(s.getSeoSettings(), Map.class)
                            : Map.of()
            );
        } catch (Exception e) { return ResponseEntity.ok(Map.of()); }
    }

    @PutMapping("/auth/seo-settings")
    public ResponseEntity<?> updateSeoSettings(@AuthenticationPrincipal String userId,
                                                @RequestBody Map<String, Object> body) {
        try {
            UserSettings s = authService.getSettings(userId);
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> existing = new java.util.HashMap<>();
            if (s.getSeoSettings() != null && !s.getSeoSettings().isBlank()) {
                existing.putAll(mapper.readValue(s.getSeoSettings(), Map.class));
            }
            existing.putAll(body);
            String[] seoKeys = {"gtmId","ga4Id","defaultAuthor","defaultOgImage","robotsPolicy","organizationName","organizationLogo"};
            Map<String, Object> filtered = new java.util.LinkedHashMap<>();
            for (String k : seoKeys) if (body.containsKey(k)) filtered.put(k, body.get(k));
            existing.putAll(filtered);
            authService.updateSettings(userId, Map.of("seoSettings", mapper.writeValueAsString(existing)));
            return ResponseEntity.ok(existing);
        } catch (Exception e) { return ResponseEntity.internalServerError().body(new ApiError("Server error")); }
    }

    @PutMapping("/auth/avatar")
    public ResponseEntity<?> updateAvatar(@AuthenticationPrincipal String userId,
                                           @RequestBody Map<String, Object> body) {
        String avatarUrl = (String) body.get("avatarUrl");
        authService.updateAvatar(userId, avatarUrl);
        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl != null ? avatarUrl : ""));
    }

    @PutMapping("/auth/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal String userId,
                                            @RequestBody Map<String, Object> body) {
        authService.updateProfile(userId, (String) body.get("firstName"), (String) body.get("lastName"));
        return ResponseEntity.ok(authService.getMe(userId));
    }

    @PutMapping("/auth/email")
    public ResponseEntity<?> updateEmail(@AuthenticationPrincipal String userId,
                                          @RequestBody Map<String, Object> body) {
        authService.updateEmail(userId, (String) body.get("newEmail"), (String) body.get("password"));
        return ResponseEntity.ok(Map.of("email", body.get("newEmail")));
    }

    @PutMapping("/auth/password")
    public ResponseEntity<?> updatePassword(@AuthenticationPrincipal String userId,
                                             @RequestBody Map<String, Object> body) {
        authService.updatePassword(userId, (String) body.get("currentPassword"), (String) body.get("newPassword"));
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/auth/2fa/send")
    public ResponseEntity<?> send2fa(@AuthenticationPrincipal String userId) {
        String code = authService.sendTwoFa(userId);
        return ResponseEntity.ok(Map.of("sent", true, "codeForDemo", code));
    }

    @PostMapping("/auth/2fa/verify")
    public ResponseEntity<?> verify2fa(@AuthenticationPrincipal String userId,
                                        @RequestBody Map<String, Object> body) {
        boolean ok = authService.verifyTwoFa(userId, (String) body.get("code"));
        if (!ok) return ResponseEntity.badRequest().body(new ApiError("Неверный или истёкший код"));
        return ResponseEntity.ok(Map.of("verified", true));
    }

    @PostMapping("/auth/support")
    public ResponseEntity<?> support(@AuthenticationPrincipal String userId,
                                      @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(Map.of(
                "ticketId", "TICK-" + Long.toString(System.currentTimeMillis(), 36).toUpperCase(),
                "status", "open",
                "createdAt", java.time.LocalDateTime.now().toString()
        ));
    }
}
