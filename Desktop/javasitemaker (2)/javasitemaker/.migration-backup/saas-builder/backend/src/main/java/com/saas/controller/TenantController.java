package com.saas.controller;

import com.saas.dto.CreateTenantRequest;
import com.saas.dto.TenantResponse;
import com.saas.service.TenantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/tenants")
@RequiredArgsConstructor
public class TenantController {

    private final TenantService tenantService;

    @PostMapping
    public ResponseEntity<TenantResponse> createTenant(
            @Valid @RequestBody CreateTenantRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        TenantResponse response = tenantService.createTenant(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TenantResponse> getTenant(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(tenantService.getTenant(id, userDetails.getUsername()));
    }

    @GetMapping
    public ResponseEntity<List<TenantResponse>> getMyTenants(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(tenantService.getTenantsForUser(userDetails.getUsername()));
    }
}
