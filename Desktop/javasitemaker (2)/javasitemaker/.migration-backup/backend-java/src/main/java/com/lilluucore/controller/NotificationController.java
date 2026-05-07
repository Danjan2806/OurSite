package com.lilluucore.controller;

import com.lilluucore.entity.Notification;
import com.lilluucore.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notifRepo;

    public NotificationController(NotificationRepository notifRepo) {
        this.notifRepo = notifRepo;
    }

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        return ResponseEntity.ok(notifRepo.findByUserIdOrderByCreatedAtDesc(userId)
            .stream().limit(50).toList());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        return ResponseEntity.ok(Map.of("count", notifRepo.countByUserIdAndReadFalse(userId)));
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> readAll(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        notifRepo.markAllReadByUserId(userId);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> readOne(@AuthenticationPrincipal String userId,
                                     @PathVariable Long id) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        notifRepo.findById(id).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notifRepo.save(n);
            }
        });
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
