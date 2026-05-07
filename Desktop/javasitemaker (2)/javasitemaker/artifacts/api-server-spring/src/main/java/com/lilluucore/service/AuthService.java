package com.lilluucore.service;

import com.lilluucore.dto.AuthResponse;
import com.lilluucore.dto.LoginRequest;
import com.lilluucore.dto.RegisterRequest;
import com.lilluucore.entity.User;
import com.lilluucore.entity.UserSettings;
import com.lilluucore.repository.UserRepository;
import com.lilluucore.repository.UserSettingsRepository;
import com.lilluucore.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private final UserRepository userRepo;
    private final UserSettingsRepository settingsRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private final Map<String, TwoFaEntry> twoFaCodes = new ConcurrentHashMap<>();

    public AuthService(UserRepository userRepo, UserSettingsRepository settingsRepo,
                       PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.settingsRepo = settingsRepo;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepo.existsByEmail(req.getEmail()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email уже зарегистрирован");

        User user = new User();
        user.setId(generateId());
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setPlan("free");
        user.setRole("user");
        userRepo.save(user);

        UserSettings settings = new UserSettings();
        settings.setUserId(user.getId());
        settingsRepo.save(settings);

        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getPlan(), user.getRole(), null);
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepo.findByEmail(req.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный email или пароль"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный email или пароль");

        UserSettings settings = settingsRepo.findByUserId(user.getId()).orElse(null);
        String token = jwtUtil.generateToken(user.getId());
        return new AuthResponse(token, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getPlan(), user.getRole(),
                settings != null ? settings.getAvatarUrl() : null);
    }

    public AuthResponse getMe(String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        UserSettings settings = settingsRepo.findByUserId(userId).orElse(null);
        return new AuthResponse(null, user.getId(), user.getEmail(),
                user.getFirstName(), user.getLastName(), user.getPlan(), user.getRole(),
                settings != null ? settings.getAvatarUrl() : null);
    }

    public UserSettings getSettings(String userId) {
        return settingsRepo.findByUserId(userId).orElseGet(() -> {
            UserSettings s = new UserSettings();
            s.setUserId(userId);
            return s;
        });
    }

    @Transactional
    public UserSettings updateSettings(String userId, Map<String, Object> body) {
        UserSettings s = settingsRepo.findByUserId(userId).orElseGet(() -> {
            UserSettings ns = new UserSettings();
            ns.setUserId(userId);
            return ns;
        });
        if (body.containsKey("theme")) s.setTheme((String) body.get("theme"));
        if (body.containsKey("notifications")) s.setNotifications((Boolean) body.get("notifications"));
        if (body.containsKey("emailNotifications")) s.setEmailNotifications((Boolean) body.get("emailNotifications"));
        s.setUpdatedAt(LocalDateTime.now());
        return settingsRepo.save(s);
    }

    @Transactional
    public void updateProfile(String userId, String firstName, String lastName) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (firstName == null || lastName == null || firstName.isBlank() || lastName.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Имя и фамилия обязательны");
        user.setFirstName(firstName);
        user.setLastName(lastName);
        userRepo.save(user);
    }

    @Transactional
    public void updateEmail(String userId, String newEmail, String password) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!passwordEncoder.matches(password, user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный пароль");
        if (userRepo.existsByEmail(newEmail))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email уже занят");
        user.setEmail(newEmail);
        userRepo.save(user);
    }

    @Transactional
    public void updatePassword(String userId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Минимум 6 символов");
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Неверный текущий пароль");
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }

    @Transactional
    public void updateAvatar(String userId, String avatarUrl) {
        UserSettings s = settingsRepo.findByUserId(userId).orElseGet(() -> {
            UserSettings ns = new UserSettings();
            ns.setUserId(userId);
            return ns;
        });
        s.setAvatarUrl(avatarUrl);
        s.setUpdatedAt(LocalDateTime.now());
        settingsRepo.save(s);
    }

    public String sendTwoFa(String userId) {
        String code = String.format("%06d", (int) (Math.random() * 900000) + 100000);
        twoFaCodes.put(userId, new TwoFaEntry(code, System.currentTimeMillis() + 5 * 60 * 1000));
        return code;
    }

    public boolean verifyTwoFa(String userId, String code) {
        TwoFaEntry entry = twoFaCodes.get(userId);
        if (entry == null || !entry.code.equals(code) || System.currentTimeMillis() > entry.expiresAt) return false;
        twoFaCodes.remove(userId);
        return true;
    }

    private String generateId() {
        return Long.toString(System.currentTimeMillis(), 36) + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }

    private record TwoFaEntry(String code, long expiresAt) {}
}
