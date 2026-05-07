package com.lilluucore.controller;

import com.lilluucore.service.BillingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping("/billing/subscribe")
    public ResponseEntity<?> subscribe(@AuthenticationPrincipal String userId,
                                        @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(billingService.subscribe(userId, body));
    }

    @PostMapping("/billing/cancel")
    public ResponseEntity<?> cancel(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(billingService.cancel(userId));
    }
}
