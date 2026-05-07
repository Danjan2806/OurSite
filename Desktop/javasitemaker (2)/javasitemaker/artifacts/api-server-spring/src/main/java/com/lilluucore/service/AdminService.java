package com.lilluucore.service;

import com.lilluucore.entity.Site;
import com.lilluucore.entity.User;
import com.lilluucore.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class AdminService {

    private final UserRepository userRepo;
    private final UserSettingsRepository settingsRepo;
    private final SiteRepository siteRepo;
    private final BlockRepository blockRepo;
    private final NotificationService notifService;

    public AdminService(UserRepository userRepo, UserSettingsRepository settingsRepo,
                        SiteRepository siteRepo, BlockRepository blockRepo,
                        NotificationService notifService) {
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
        this.siteRepo = siteRepo;
        this.blockRepo = blockRepo;
        this.notifService = notifService;
    }

    public void requireAdmin(String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
        if (!"admin".equals(user.getRole()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Доступ запрещён. Требуются права администратора.");
    }

    public void requireStaff(String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized"));
        if (!"admin".equals(user.getRole()) && !"moderator".equals(user.getRole()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Доступ запрещён. Требуются права модератора.");
    }

    public Map<String, Object> getStats(String userId) {
        requireAdmin(userId);
        List<User> users = userRepo.findAll();
        List<Site> sites = siteRepo.findAll();
        long blocks = blockRepo.count();

        long published = sites.stream().filter(s -> "PUBLISHED".equals(s.getStatus())).count();
        long drafts = sites.stream().filter(s -> "DRAFT".equals(s.getStatus())).count();
        Map<String, Long> byType = new HashMap<>();
        for (Site s : sites) byType.merge(s.getBusinessType(), 1L, Long::sum);
        Map<String, Long> byPlan = new HashMap<>();
        for (User u : users) byPlan.merge(u.getPlan(), 1L, Long::sum);
        long adminCount = users.stream().filter(u -> "admin".equals(u.getRole())).count();

        List<Map<String, Object>> regChart = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDateTime day = LocalDateTime.now().minusDays(i);
            String dateStr = day.toLocalDate().toString();
            long count = users.stream().filter(u -> u.getCreatedAt().toLocalDate().toString().equals(dateStr)).count();
            regChart.add(Map.of("date", dateStr, "registrations", count));
        }

        return Map.of(
                "totalUsers", users.size(), "totalSites", sites.size(),
                "totalBlocks", blocks, "publishedSites", published, "draftSites", drafts,
                "adminUsers", adminCount, "sitesByType", byType,
                "usersByPlan", byPlan, "registrationChart", regChart
        );
    }

    public List<Map<String, Object>> getUsers(String userId) {
        requireAdmin(userId);
        List<User> users = userRepo.findAllByOrderByCreatedAtDesc();
        var settings = settingsRepo.findAll();
        Map<String, String> avMap = new HashMap<>();
        for (var s : settings) avMap.put(s.getUserId(), s.getAvatarUrl());

        var sites = siteRepo.findAll();
        Map<String, Long> scMap = new HashMap<>();
        for (var s : sites) scMap.merge(s.getUserId(), 1L, Long::sum);

        return users.stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId());
            m.put("email", u.getEmail());
            m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName());
            m.put("plan", u.getPlan());
            m.put("role", u.getRole());
            m.put("sitesCount", scMap.getOrDefault(u.getId(), 0L));
            m.put("avatarUrl", avMap.get(u.getId()));
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).toList();
    }

    @Transactional
    public User updateUser(String adminId, String targetId, Map<String, Object> body) {
        requireAdmin(adminId);
        User user = userRepo.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (body.containsKey("plan")) user.setPlan((String) body.get("plan"));
        if (body.containsKey("role")) user.setRole((String) body.get("role"));
        return userRepo.save(user);
    }

    @Transactional
    public void deleteUser(String adminId, String targetId) {
        requireAdmin(adminId);
        if (adminId.equals(targetId))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нельзя удалить себя");
        userRepo.deleteById(targetId);
    }

    public List<Map<String, Object>> getSites(String staffId) {
        requireStaff(staffId);
        List<Site> sites = siteRepo.findAllByOrderByUpdatedAtDesc();
        List<User> users = userRepo.findAll();
        Map<String, User> uMap = new HashMap<>();
        for (User u : users) uMap.put(u.getId(), u);
        Map<String, Long> bcMap = new HashMap<>();
        for (Site s : sites) bcMap.put(s.getId(), blockRepo.countBySiteId(s.getId()));

        return sites.stream().map(s -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId()); m.put("name", s.getName());
            m.put("subdomain", s.getSubdomain()); m.put("businessType", s.getBusinessType());
            m.put("status", s.getStatus()); m.put("publishedUrl", s.getPublishedUrl());
            m.put("createdAt", s.getCreatedAt()); m.put("updatedAt", s.getUpdatedAt());
            m.put("userId", s.getUserId()); m.put("frozen", s.isFrozen());
            m.put("frozenReason", s.getFrozenReason()); m.put("frozenBy", s.getFrozenBy());
            m.put("frozenAt", s.getFrozenAt()); m.put("blocksCount", bcMap.getOrDefault(s.getId(), 0L));
            User owner = uMap.get(s.getUserId());
            if (owner != null) {
                m.put("owner", Map.of("id", owner.getId(), "email", owner.getEmail(),
                        "firstName", owner.getFirstName(), "lastName", owner.getLastName()));
            }
            return m;
        }).toList();
    }

    @Transactional
    public void deleteSite(String staffId, String siteId, String reason) {
        requireAdmin(staffId);
        Site site = siteRepo.findById(siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        String msg = reason != null && !reason.isBlank()
                ? "Ваш сайт «" + site.getName() + "» был удалён администратором. Причина: " + reason
                : "Ваш сайт «" + site.getName() + "» был удалён администратором.";
        notifService.create(site.getUserId(), "Сайт удалён", msg, "error");
        siteRepo.delete(site);
    }

    @Transactional
    public void freezeSite(String staffId, String siteId, boolean frozen, String reason) {
        requireStaff(staffId);
        Site site = siteRepo.findById(siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        String frozenReason = frozen ? (reason != null ? reason : "Нарушение пользовательского соглашения") : null;
        site.setFrozen(frozen);
        site.setFrozenReason(frozenReason);
        site.setFrozenBy(frozen ? staffId : null);
        site.setFrozenAt(frozen ? LocalDateTime.now() : null);
        site.setUpdatedAt(LocalDateTime.now());
        siteRepo.save(site);

        String title = frozen ? "Сайт заморожен" : "Сайт разморожен";
        String msg = frozen
                ? "Ваш сайт «" + site.getName() + "» был заморожен. Причина: " + frozenReason + "."
                : "Ваш сайт «" + site.getName() + "» был разморожен.";
        notifService.create(site.getUserId(), title, msg, frozen ? "moderation" : "success");
    }

    @Transactional
    public void setDbLock(String adminId, String targetId, boolean locked, String reason) {
        requireAdmin(adminId);
        var settings = settingsRepo.findByUserId(targetId).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User settings not found"));
        settings.setDbAccessLocked(locked);
        settings.setDbLockReason(locked ? (reason != null ? reason : "Временные технические работы") : null);
        settings.setUpdatedAt(LocalDateTime.now());
        settingsRepo.save(settings);
        String title = locked ? "Дамп памяти временно недоступен" : "Дамп памяти снова доступен";
        String msg = locked ? (reason != null ? reason : "Временные технические работы") : "Доступ восстановлен.";
        notifService.create(targetId, title, msg, locked ? "warning" : "success");
    }

    @Transactional
    public int setDbLockAll(String adminId, boolean locked, String reason) {
        requireAdmin(adminId);
        List<User> users = userRepo.findAll();
        for (User u : users) {
            var settings = settingsRepo.findByUserId(u.getId()).orElse(null);
            if (settings == null) continue;
            settings.setDbAccessLocked(locked);
            settings.setDbLockReason(locked ? (reason != null ? reason : "Временные технические работы") : null);
            settings.setUpdatedAt(LocalDateTime.now());
            settingsRepo.save(settings);
        }
        String title = locked ? "Дамп памяти временно недоступен" : "Дамп памяти снова доступен";
        String msg = locked ? (reason != null ? reason : "Временные технические работы") : "Доступ восстановлен.";
        notifService.broadcast(users.stream().map(User::getId).toList(), title, msg, locked ? "warning" : "success");
        return users.size();
    }

    public Map<String, Object> getSystemInfo(String adminId) {
        requireAdmin(adminId);
        Runtime rt = Runtime.getRuntime();
        return Map.of(
                "javaVersion", System.getProperty("java.version"),
                "platform", System.getProperty("os.name"),
                "totalMemoryMb", rt.totalMemory() / 1024 / 1024,
                "freeMemoryMb", rt.freeMemory() / 1024 / 1024,
                "usedMemoryMb", (rt.totalMemory() - rt.freeMemory()) / 1024 / 1024,
                "env", System.getenv().getOrDefault("NODE_ENV", "production"),
                "framework", "Spring Boot 3"
        );
    }
}
