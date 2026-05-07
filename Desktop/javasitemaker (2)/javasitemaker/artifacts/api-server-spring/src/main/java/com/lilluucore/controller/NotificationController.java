package com.lilluucore.controller;

import com.lilluucore.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class NotificationController {

    private final NotificationService notifService;

    public NotificationController(NotificationService notifService) {
        this.notifService = notifService;
    }

    @GetMapping("/notifications")
    public ResponseEntity<?> getAll(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(notifService.getNotifications(userId));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(Map.of("count", notifService.getUnreadCount(userId)));
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal String userId) {
        notifService.markAllRead(userId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markOneRead(@AuthenticationPrincipal String userId,
                                          @PathVariable Long id) {
        notifService.markOneRead(userId, id);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
