package com.lilluucore.controller;

import com.lilluucore.service.AdminService;
import com.lilluucore.service.NotificationService;
import com.lilluucore.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class AdminController {

    private final AdminService adminService;
    private final NotificationService notifService;
    private final UserRepository userRepo;

    public AdminController(AdminService adminService, NotificationService notifService,
                           UserRepository userRepo) {
        this.adminService = adminService;
        this.notifService = notifService;
        this.userRepo = userRepo;
    }

    @GetMapping("/admin/stats")
    public ResponseEntity<?> getStats(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(adminService.getStats(userId));
    }

    @GetMapping("/admin/users")
    public ResponseEntity<?> getUsers(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(adminService.getUsers(userId));
    }

    @PutMapping("/admin/users/{id}")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal String adminId,
                                         @PathVariable String id,
                                         @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(adminService.updateUser(adminId, id, body));
    }

    @DeleteMapping("/admin/users/{id}")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal String adminId,
                                         @PathVariable String id) {
        adminService.deleteUser(adminId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/sites")
    public ResponseEntity<?> getSites(@AuthenticationPrincipal String staffId) {
        return ResponseEntity.ok(adminService.getSites(staffId));
    }

    @DeleteMapping("/admin/sites/{id}")
    public ResponseEntity<?> deleteSite(@AuthenticationPrincipal String staffId,
                                         @PathVariable String id,
                                         @RequestParam(required = false) String reason) {
        adminService.deleteSite(staffId, id, reason);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/admin/sites/{id}/freeze")
    public ResponseEntity<?> freezeSite(@AuthenticationPrincipal String staffId,
                                         @PathVariable String id,
                                         @RequestBody Map<String, Object> body) {
        boolean frozen = Boolean.TRUE.equals(body.get("frozen"));
        String reason = (String) body.get("reason");
        adminService.freezeSite(staffId, id, frozen, reason);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/admin/users/{id}/db-lock")
    public ResponseEntity<?> setDbLock(@AuthenticationPrincipal String adminId,
                                        @PathVariable String id,
                                        @RequestBody Map<String, Object> body) {
        boolean locked = Boolean.TRUE.equals(body.get("locked"));
        String reason = (String) body.get("reason");
        adminService.setDbLock(adminId, id, locked, reason);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/admin/db-lock-all")
    public ResponseEntity<?> setDbLockAll(@AuthenticationPrincipal String adminId,
                                           @RequestBody Map<String, Object> body) {
        boolean locked = Boolean.TRUE.equals(body.get("locked"));
        String reason = (String) body.get("reason");
        int affected = adminService.setDbLockAll(adminId, locked, reason);
        return ResponseEntity.ok(Map.of("ok", true, "affected", affected));
    }

    @GetMapping("/admin/system")
    public ResponseEntity<?> getSystem(@AuthenticationPrincipal String adminId) {
        return ResponseEntity.ok(adminService.getSystemInfo(adminId));
    }

    @PostMapping("/admin/notifications")
    public ResponseEntity<?> sendNotification(@AuthenticationPrincipal String staffId,
                                               @RequestBody Map<String, Object> body) {
        adminService.requireStaff(staffId);
        String targetUserId = (String) body.get("userId");
        String title = (String) body.get("title");
        String message = (String) body.get("message");
        String type = (String) body.get("type");
        if (targetUserId == null || title == null || message == null)
            return ResponseEntity.badRequest().body(Map.of("message", "userId, title, message обязательны"));
        return ResponseEntity.ok(notifService.create(targetUserId, title, message, type));
    }

    @PostMapping("/admin/notifications/broadcast")
    public ResponseEntity<?> broadcast(@AuthenticationPrincipal String staffId,
                                        @RequestBody Map<String, Object> body) {
        adminService.requireStaff(staffId);
        String title = (String) body.get("title");
        String message = (String) body.get("message");
        String type = (String) body.get("type");
        if (title == null || message == null)
            return ResponseEntity.badRequest().body(Map.of("message", "title, message обязательны"));
        List<String> allIds = userRepo.findAll().stream().map(u -> u.getId()).toList();
        int sent = notifService.broadcast(allIds, title, message, type);
        return ResponseEntity.ok(Map.of("sent", sent));
    }
}
