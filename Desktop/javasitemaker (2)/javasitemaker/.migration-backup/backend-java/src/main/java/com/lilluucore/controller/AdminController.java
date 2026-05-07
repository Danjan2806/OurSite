package com.lilluucore.controller;

import com.lilluucore.entity.*;
import com.lilluucore.repository.*;
import jakarta.persistence.EntityManager;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepo;
    private final UserSettingsRepository settingsRepo;
    private final SiteRepository siteRepo;
    private final BlockRepository blockRepo;
    private final NotificationRepository notifRepo;
    private final EntityManager em;

    public AdminController(UserRepository userRepo, UserSettingsRepository settingsRepo,
                           SiteRepository siteRepo, BlockRepository blockRepo,
                           NotificationRepository notifRepo, EntityManager em) {
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
        this.siteRepo = siteRepo;
        this.blockRepo = blockRepo;
        this.notifRepo = notifRepo;
        this.em = em;
    }

    private ResponseEntity<?> checkAdmin(String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<User> u = userRepo.findById(userId);
        if (u.isEmpty() || !"admin".equals(u.get().getRole()))
            return ResponseEntity.status(403).body(Map.of("message", "Доступ запрещён. Требуются права администратора."));
        return null;
    }

    private ResponseEntity<?> checkStaff(String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<User> u = userRepo.findById(userId);
        if (u.isEmpty() || (!"admin".equals(u.get().getRole()) && !"moderator".equals(u.get().getRole())))
            return ResponseEntity.status(403).body(Map.of("message", "Доступ запрещён. Требуются права модератора или администратора."));
        return null;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@AuthenticationPrincipal String userId) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;

        List<User> allUsers = userRepo.findAll();
        List<Site> allSites = siteRepo.findAll();
        long totalBlocks = blockRepo.count();

        long publishedCount = allSites.stream().filter(s -> "PUBLISHED".equals(s.getStatus())).count();
        long draftCount = allSites.stream().filter(s -> "DRAFT".equals(s.getStatus())).count();
        long adminCount = allUsers.stream().filter(u -> "admin".equals(u.getRole())).count();

        Map<String, Long> sitesByType = allSites.stream()
            .collect(Collectors.groupingBy(Site::getBusinessType, Collectors.counting()));
        Map<String, Long> usersByPlan = allUsers.stream()
            .collect(Collectors.groupingBy(User::getPlan, Collectors.counting()));

        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE.withZone(ZoneId.systemDefault());
        List<Map<String, Object>> regChart = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            String dateStr = fmt.format(Instant.now().minusSeconds((long)i * 86400));
            long count = allUsers.stream().filter(u ->
                fmt.format(u.getCreatedAt()).equals(dateStr)).count();
            regChart.add(Map.of("date", dateStr, "registrations", count));
        }

        return ResponseEntity.ok(Map.of(
            "totalUsers", allUsers.size(),
            "totalSites", allSites.size(),
            "totalBlocks", totalBlocks,
            "publishedSites", publishedCount,
            "draftSites", draftCount,
            "adminUsers", adminCount,
            "sitesByType", sitesByType,
            "usersByPlan", usersByPlan,
            "registrationChart", regChart
        ));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@AuthenticationPrincipal String userId) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;

        List<User> users = userRepo.findAllByOrderByCreatedAtDesc();
        Map<String, Long> siteCounts = siteRepo.findAll().stream()
            .collect(Collectors.groupingBy(Site::getUserId, Collectors.counting()));
        Map<String, String> avatarMap = settingsRepo.findAll().stream()
            .collect(Collectors.toMap(UserSettings::getUserId,
                s -> s.getAvatarUrl() != null ? s.getAvatarUrl() : ""));

        return ResponseEntity.ok(users.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("email", u.getEmail());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("plan", u.getPlan());
            m.put("role", u.getRole());
            m.put("sitesCount", siteCounts.getOrDefault(u.getId(), 0L));
            m.put("avatarUrl", avatarMap.getOrDefault(u.getId(), ""));
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).toList());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @RequestBody Map<String, Object> body) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;
        Optional<User> userOpt = userRepo.findById(id);
        if (userOpt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        User user = userOpt.get();
        if (body.containsKey("plan")) user.setPlan((String) body.get("plan"));
        if (body.containsKey("role")) user.setRole((String) body.get("role"));
        return ResponseEntity.ok(userRepo.save(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@AuthenticationPrincipal String userId,
                                        @PathVariable String id) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;
        if (id.equals(userId)) return ResponseEntity.badRequest().body(Map.of("message", "Нельзя удалить себя"));
        userRepo.deleteById(id);
        return ResponseEntity.status(204).build();
    }

    @GetMapping("/sites")
    public ResponseEntity<?> listSites(@AuthenticationPrincipal String userId) {
        ResponseEntity<?> check = checkStaff(userId);
        if (check != null) return check;

        List<Site> sites = siteRepo.findAllByOrderByUpdatedAtDesc();
        Map<String, Long> blockCounts = blockRepo.findAll().stream()
            .collect(Collectors.groupingBy(Block::getSiteId, Collectors.counting()));
        Map<String, User> userMap = userRepo.findAll().stream()
            .collect(Collectors.toMap(User::getId, u -> u));

        return ResponseEntity.ok(sites.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("name", s.getName());
            m.put("subdomain", s.getSubdomain());
            m.put("businessType", s.getBusinessType());
            m.put("status", s.getStatus());
            m.put("publishedUrl", s.getPublishedUrl());
            m.put("createdAt", s.getCreatedAt());
            m.put("updatedAt", s.getUpdatedAt());
            m.put("userId", s.getUserId());
            m.put("frozen", s.isFrozen());
            m.put("frozenReason", s.getFrozenReason());
            m.put("frozenBy", s.getFrozenBy());
            m.put("frozenAt", s.getFrozenAt());
            m.put("blocksCount", blockCounts.getOrDefault(s.getId(), 0L));
            User owner = userMap.get(s.getUserId());
            if (owner != null) {
                m.put("owner", Map.of("id", owner.getId(), "email", owner.getEmail(),
                    "firstName", owner.getFirstName(), "lastName", owner.getLastName()));
            } else {
                m.put("owner", null);
            }
            return m;
        }).toList());
    }

    @DeleteMapping("/sites/{id}")
    public ResponseEntity<?> deleteSite(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @RequestParam(required = false, defaultValue = "") String reason) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;

        siteRepo.findById(id).ifPresent(site -> {
            String msg = reason.isBlank()
                ? "Ваш сайт «" + site.getName() + "» был удалён администратором."
                : "Ваш сайт «" + site.getName() + "» был удалён администратором. Причина: " + reason;
            Notification n = new Notification();
            n.setUserId(site.getUserId());
            n.setTitle("Сайт удалён");
            n.setMessage(msg);
            n.setType("error");
            notifRepo.save(n);
            siteRepo.delete(site);
        });
        return ResponseEntity.status(204).build();
    }

    @PutMapping("/sites/{id}/freeze")
    public ResponseEntity<?> freezeSite(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @RequestBody Map<String, Object> body) {
        ResponseEntity<?> check = checkStaff(userId);
        if (check != null) return check;

        boolean frozen = Boolean.TRUE.equals(body.get("frozen"));
        String reason = (String) body.getOrDefault("reason", "Нарушение пользовательского соглашения");

        siteRepo.findById(id).ifPresent(site -> {
            site.setFrozen(frozen);
            site.setFrozenReason(frozen ? reason : null);
            site.setFrozenBy(frozen ? userId : null);
            site.setFrozenAt(frozen ? Instant.now() : null);
            site.setUpdatedAt(Instant.now());
            siteRepo.save(site);

            Notification n = new Notification();
            n.setUserId(site.getUserId());
            n.setTitle(frozen ? "Сайт заморожен" : "Сайт разморожен");
            n.setMessage(frozen
                ? "Ваш сайт «" + site.getName() + "» был заморожен модератором. Причина: " + reason + ". Сайт недоступен для посетителей до разморозки."
                : "Ваш сайт «" + site.getName() + "» был разморожен. Сайт снова доступен.");
            n.setType(frozen ? "moderation" : "success");
            notifRepo.save(n);
        });
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/users/{id}/db-lock")
    public ResponseEntity<?> dbLockUser(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @RequestBody Map<String, Object> body) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;

        boolean locked = Boolean.TRUE.equals(body.get("locked"));
        String reason = (String) body.getOrDefault("reason", locked ? "Временные технические работы" : null);

        UserSettings s = settingsRepo.findByUserId(id).orElseGet(() -> {
            UserSettings ns = new UserSettings(); ns.setUserId(id); return ns;
        });
        s.setDbAccessLocked(locked);
        s.setDbLockReason(locked ? reason : null);
        s.setUpdatedAt(Instant.now());
        settingsRepo.save(s);

        Notification n = new Notification();
        n.setUserId(id);
        n.setTitle(locked ? "Дамп памяти временно недоступен" : "Дамп памяти снова доступен");
        n.setMessage(locked ? reason : "Доступ к вашему дампу памяти восстановлен.");
        n.setType(locked ? "warning" : "success");
        notifRepo.save(n);

        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PutMapping("/db-lock-all")
    public ResponseEntity<?> dbLockAll(@AuthenticationPrincipal String userId,
                                       @RequestBody Map<String, Object> body) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;

        boolean locked = Boolean.TRUE.equals(body.get("locked"));
        String reason = (String) body.getOrDefault("reason", locked ? "Временные технические работы" : null);

        List<UserSettings> allSettings = settingsRepo.findAll();
        allSettings.forEach(s -> {
            s.setDbAccessLocked(locked);
            s.setDbLockReason(locked ? reason : null);
            s.setUpdatedAt(Instant.now());
        });
        settingsRepo.saveAll(allSettings);

        List<User> allUsers = userRepo.findAll();
        List<Notification> notifs = allUsers.stream().map(u -> {
            Notification n = new Notification();
            n.setUserId(u.getId());
            n.setTitle(locked ? "Дамп памяти временно недоступен" : "Дамп памяти снова доступен");
            n.setMessage(locked ? reason : "Доступ к вашему дампу памяти восстановлен.");
            n.setType(locked ? "warning" : "success");
            return n;
        }).toList();
        notifRepo.saveAll(notifs);

        return ResponseEntity.ok(Map.of("ok", true, "affected", allUsers.size()));
    }

    @GetMapping("/system")
    public ResponseEntity<?> systemInfo(@AuthenticationPrincipal String userId) {
        ResponseEntity<?> check = checkAdmin(userId);
        if (check != null) return check;

        Object[] dbSizeResult;
        try {
            dbSizeResult = (Object[]) em.createNativeQuery(
                "SELECT pg_size_pretty(pg_database_size(current_database())), pg_database_size(current_database())"
            ).getSingleResult();
        } catch (Exception e) {
            dbSizeResult = new Object[]{"N/A", 0};
        }

        Runtime rt = Runtime.getRuntime();
        return ResponseEntity.ok(Map.of(
            "dbSizePretty", dbSizeResult[0] != null ? dbSizeResult[0].toString() : "N/A",
            "dbSizeBytes", dbSizeResult[1] != null ? dbSizeResult[1] : 0,
            "javaVersion", System.getProperty("java.version"),
            "platform", System.getProperty("os.name"),
            "uptime", ProcessHandle.current().info().startInstant()
                .map(s -> Duration.between(s, Instant.now()).getSeconds()).orElse(0L),
            "memoryMb", (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024),
            "env", System.getenv().getOrDefault("SPRING_PROFILES_ACTIVE", "development")
        ));
    }

    @PostMapping("/notifications")
    public ResponseEntity<?> sendNotification(@AuthenticationPrincipal String userId,
                                              @RequestBody Map<String, Object> body) {
        ResponseEntity<?> check = checkStaff(userId);
        if (check != null) return check;

        String targetUserId = (String) body.get("userId");
        String title = (String) body.get("title");
        String message = (String) body.get("message");
        if (targetUserId == null || title == null || message == null)
            return ResponseEntity.badRequest().body(Map.of("message", "userId, title, message обязательны"));

        Notification n = new Notification();
        n.setUserId(targetUserId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType((String) body.getOrDefault("type", "warning"));
        return ResponseEntity.ok(notifRepo.save(n));
    }

    @PostMapping("/notifications/broadcast")
    public ResponseEntity<?> broadcast(@AuthenticationPrincipal String userId,
                                       @RequestBody Map<String, Object> body) {
        ResponseEntity<?> check = checkStaff(userId);
        if (check != null) return check;

        String title = (String) body.get("title");
        String message = (String) body.get("message");
        if (title == null || message == null)
            return ResponseEntity.badRequest().body(Map.of("message", "title, message обязательны"));

        List<User> allUsers = userRepo.findAll();
        String type = (String) body.getOrDefault("type", "info");
        List<Notification> notifs = allUsers.stream().map(u -> {
            Notification n = new Notification();
            n.setUserId(u.getId());
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type);
            return n;
        }).toList();
        notifRepo.saveAll(notifs);
        return ResponseEntity.ok(Map.of("sent", notifs.size()));
    }
}
