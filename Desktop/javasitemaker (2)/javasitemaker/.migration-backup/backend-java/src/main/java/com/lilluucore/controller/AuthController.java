package com.lilluucore.controller;

import com.lilluucore.entity.*;
import com.lilluucore.repository.*;
import com.lilluucore.service.JwtService;
import com.lilluucore.service.JsonHelper;
import com.lilluucore.service.TwoFaStore;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepo;
    private final UserSettingsRepository settingsRepo;
    private final ChatMessageRepository chatRepo;
    private final NotificationRepository notifRepo;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final TwoFaStore twoFaStore;

    public AuthController(UserRepository userRepo, UserSettingsRepository settingsRepo,
                          ChatMessageRepository chatRepo, NotificationRepository notifRepo,
                          JwtService jwtService, PasswordEncoder passwordEncoder,
                          TwoFaStore twoFaStore) {
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
        this.chatRepo = chatRepo;
        this.notifRepo = notifRepo;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.twoFaStore = twoFaStore;
    }

    private String generateId() {
        return Long.toString(Math.abs(new Random().nextLong()), 36) + Long.toString(System.currentTimeMillis(), 36);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        if (email == null || password == null || firstName == null || lastName == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Все поля обязательны"));
        if (userRepo.existsByEmail(email))
            return ResponseEntity.status(409).body(Map.of("message", "Email уже зарегистрирован"));

        String id = generateId();
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setPlan("free");
        user.setRole("user");
        userRepo.save(user);

        UserSettings settings = new UserSettings();
        settings.setUserId(id);
        settingsRepo.save(settings);

        String token = jwtService.generateToken(id);
        return ResponseEntity.ok(Map.of("token", token, "userId", id, "email", email,
            "firstName", firstName, "lastName", lastName, "plan", "free"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        Optional<User> optUser = userRepo.findByEmail(email);
        if (optUser.isEmpty() || !passwordEncoder.matches(password, optUser.get().getPasswordHash()))
            return ResponseEntity.status(401).body(Map.of("message", "Неверный email или пароль"));

        User user = optUser.get();
        Optional<UserSettings> settings = settingsRepo.findByUserId(user.getId());
        String token = jwtService.generateToken(user.getId());
        return ResponseEntity.ok(Map.of(
            "token", token,
            "userId", user.getId(),
            "email", user.getEmail(),
            "firstName", user.getFirstName(),
            "lastName", user.getLastName(),
            "plan", user.getPlan(),
            "role", user.getRole(),
            "avatarUrl", settings.map(s -> s.getAvatarUrl() != null ? s.getAvatarUrl() : "").orElse("")
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        return userRepo.findById(userId).map(user -> {
            Optional<UserSettings> settings = settingsRepo.findByUserId(userId);
            return ResponseEntity.ok(Map.of(
                "userId", user.getId(), "email", user.getEmail(),
                "firstName", user.getFirstName(), "lastName", user.getLastName(),
                "plan", user.getPlan(), "role", user.getRole(),
                "avatarUrl", settings.map(s -> s.getAvatarUrl() != null ? s.getAvatarUrl() : "").orElse("")
            ));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @GetMapping("/settings")
    public ResponseEntity<?> getSettings(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<UserSettings> s = settingsRepo.findByUserId(userId);
        if (s.isPresent()) return ResponseEntity.ok(s.get());
        return ResponseEntity.ok(Map.of("theme", "dark", "notifications", true,
            "avatarUrl", "", "dbAccessLocked", false, "dbLockReason", ""));
    }

    @PutMapping("/settings")
    public ResponseEntity<?> updateSettings(@AuthenticationPrincipal String userId,
                                            @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        UserSettings s = settingsRepo.findByUserId(userId).orElseGet(() -> {
            UserSettings ns = new UserSettings();
            ns.setUserId(userId);
            return ns;
        });
        if (body.containsKey("theme")) s.setTheme((String) body.get("theme"));
        if (body.containsKey("notifications")) s.setNotifications(Boolean.TRUE.equals(body.get("notifications")));
        if (body.containsKey("emailNotifications")) s.setEmailNotifications(Boolean.TRUE.equals(body.get("emailNotifications")));
        s.setUpdatedAt(Instant.now());
        return ResponseEntity.ok(settingsRepo.save(s));
    }

    @GetMapping("/seo-settings")
    public ResponseEntity<?> getSeoSettings(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<UserSettings> s = settingsRepo.findByUserId(userId);
        String raw = s.map(UserSettings::getSeoSettings).orElse("{}");
        return ResponseEntity.ok(JsonHelper.fromJson(raw));
    }

    @PutMapping("/seo-settings")
    public ResponseEntity<?> updateSeoSettings(@AuthenticationPrincipal String userId,
                                               @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        UserSettings s = settingsRepo.findByUserId(userId).orElseGet(() -> {
            UserSettings ns = new UserSettings();
            ns.setUserId(userId);
            return ns;
        });
        Map<String, Object> existing = new LinkedHashMap<>(JsonHelper.fromJson(s.getSeoSettings()));
        List<String> keys = List.of("gtmId","ga4Id","defaultAuthor","defaultOgImage","robotsPolicy","organizationName","organizationLogo");
        for (String key : keys) {
            if (body.containsKey(key)) existing.put(key, body.get(key));
        }
        s.setSeoSettings(JsonHelper.toJson(existing));
        s.setUpdatedAt(Instant.now());
        settingsRepo.save(s);
        return ResponseEntity.ok(existing);
    }

    @PutMapping("/avatar")
    public ResponseEntity<?> updateAvatar(@AuthenticationPrincipal String userId,
                                          @RequestBody Map<String, String> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String avatarUrl = body.get("avatarUrl");
        UserSettings s = settingsRepo.findByUserId(userId).orElseGet(() -> {
            UserSettings ns = new UserSettings(); ns.setUserId(userId); return ns;
        });
        s.setAvatarUrl(avatarUrl);
        s.setUpdatedAt(Instant.now());
        settingsRepo.save(s);
        return ResponseEntity.ok(Map.of("avatarUrl", avatarUrl != null ? avatarUrl : ""));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@AuthenticationPrincipal String userId,
                                           @RequestBody Map<String, String> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String firstName = body.get("firstName");
        String lastName = body.get("lastName");
        if (firstName == null || lastName == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Имя и фамилия обязательны"));
        return userRepo.findById(userId).map(user -> {
            user.setFirstName(firstName);
            user.setLastName(lastName);
            userRepo.save(user);
            return ResponseEntity.ok(Map.of(
                "userId", user.getId(), "email", user.getEmail(),
                "firstName", user.getFirstName(), "lastName", user.getLastName(), "plan", user.getPlan()
            ));
        }).orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }

    @PutMapping("/email")
    public ResponseEntity<?> updateEmail(@AuthenticationPrincipal String userId,
                                         @RequestBody Map<String, String> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String newEmail = body.get("newEmail");
        String password = body.get("password");
        if (newEmail == null || password == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Email и пароль обязательны"));
        Optional<User> optUser = userRepo.findById(userId);
        if (optUser.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        User user = optUser.get();
        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            return ResponseEntity.status(401).body(Map.of("message", "Неверный пароль"));
        Optional<User> existing = userRepo.findByEmail(newEmail);
        if (existing.isPresent() && !existing.get().getId().equals(userId))
            return ResponseEntity.status(409).body(Map.of("message", "Email уже занят"));
        user.setEmail(newEmail);
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("email", newEmail));
    }

    @PutMapping("/password")
    public ResponseEntity<?> updatePassword(@AuthenticationPrincipal String userId,
                                            @RequestBody Map<String, String> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String current = body.get("currentPassword");
        String newPwd = body.get("newPassword");
        if (current == null || newPwd == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Все поля обязательны"));
        if (newPwd.length() < 6)
            return ResponseEntity.badRequest().body(Map.of("message", "Минимум 6 символов"));
        Optional<User> optUser = userRepo.findById(userId);
        if (optUser.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        User user = optUser.get();
        if (!passwordEncoder.matches(current, user.getPasswordHash()))
            return ResponseEntity.status(401).body(Map.of("message", "Неверный текущий пароль"));
        user.setPasswordHash(passwordEncoder.encode(newPwd));
        userRepo.save(user);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/2fa/send")
    public ResponseEntity<?> send2fa(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String code = twoFaStore.generateAndStore(userId);
        return ResponseEntity.ok(Map.of("sent", true, "codeForDemo", code));
    }

    @PostMapping("/2fa/verify")
    public ResponseEntity<?> verify2fa(@AuthenticationPrincipal String userId,
                                       @RequestBody Map<String, String> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String code = body.get("code");
        if (!twoFaStore.verify(userId, code))
            return ResponseEntity.badRequest().body(Map.of("message", "Неверный или истёкший код"));
        return ResponseEntity.ok(Map.of("verified", true));
    }

    @PostMapping("/support")
    public ResponseEntity<?> support(@AuthenticationPrincipal String userId,
                                     @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String message = (String) body.get("message");
        String imageUrl = (String) body.get("imageUrl");
        String subject = (String) body.get("subject");
        String category = (String) body.get("category");
        if ((message == null || message.isBlank()) && imageUrl == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Сообщение обязательно"));

        String ticketId = "TICK-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        List<User> staff = userRepo.findStaff();
        if (staff.isEmpty()) {
            return ResponseEntity.ok(Map.of("ticketId", ticketId,
                "userId", "USR-" + userId.substring(0, Math.min(8, userId.length())).toUpperCase(),
                "status", "open", "createdAt", Instant.now().toString()));
        }

        String staffId = staff.stream().filter(s -> "moderator".equals(s.getRole())).findFirst()
            .map(User::getId).orElse(staff.get(0).getId());

        String prefix = "[" + ticketId + "]" + (category != null ? " [" + category + "]" : "") +
            (subject != null ? " " + subject : "") + "\n\n";

        ChatMessage userMsg = new ChatMessage();
        userMsg.setFromUserId(userId);
        userMsg.setToUserId(staffId);
        userMsg.setMessage(prefix + (message != null ? message : ""));
        userMsg.setImageUrl(imageUrl);
        userMsg.setTicketId(ticketId);
        chatRepo.save(userMsg);

        ChatMessage autoReply = new ChatMessage();
        autoReply.setFromUserId(staffId);
        autoReply.setToUserId(userId);
        autoReply.setMessage("Ваша заявка **" + ticketId + "** принята и находится в обработке. Специалист свяжется с вами в ближайшее время. Спасибо за обращение!");
        autoReply.setTicketId(ticketId);
        chatRepo.save(autoReply);

        userRepo.findById(userId).ifPresent(sender -> {
            String senderName = (sender.getFirstName() + " " + sender.getLastName()).trim();
            Notification n = new Notification();
            n.setUserId(staffId);
            n.setType("moderation");
            n.setTitle("Новое обращение в поддержку");
            n.setMessage(senderName + " создал(а) заявку " + ticketId + (subject != null ? ": " + subject : ""));
            notifRepo.save(n);
        });

        return ResponseEntity.ok(Map.of("ticketId", ticketId,
            "userId", "USR-" + userId.substring(0, Math.min(8, userId.length())).toUpperCase(),
            "status", "open", "createdAt", Instant.now().toString()));
    }
}
