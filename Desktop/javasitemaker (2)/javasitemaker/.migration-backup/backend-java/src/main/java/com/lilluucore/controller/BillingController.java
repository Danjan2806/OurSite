package com.lilluucore.controller;

import com.lilluucore.entity.User;
import com.lilluucore.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    private static final List<String> VALID_PLANS = List.of("free", "pro", "business");

    private final UserRepository userRepo;

    public BillingController(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@AuthenticationPrincipal String userId,
                                       @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));

        String plan = (String) body.get("plan");
        if (plan == null || !VALID_PLANS.contains(plan))
            return ResponseEntity.badRequest().body(Map.of("message", "Неверный тариф"));

        Optional<User> optUser = userRepo.findById(userId);
        if (optUser.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        User user = optUser.get();

        if ("free".equals(plan)) {
            user.setPlan("free");
            userRepo.save(user);
            return ResponseEntity.ok(Map.of("plan", "free", "message", "Тариф изменён на Free"));
        }

        boolean isTrial = Boolean.TRUE.equals(body.get("trial"));
        if (!isTrial) {
            String cardNumber = (String) body.get("cardNumber");
            String cardExpiry = (String) body.get("cardExpiry");
            String cardCvv = (String) body.get("cardCvv");
            String cardHolder = (String) body.get("cardHolder");
            if (cardNumber == null || cardExpiry == null || cardCvv == null || cardHolder == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Заполните все поля карты"));

            String digits = cardNumber.replaceAll("\\D", "");
            if (digits.length() < 13 || digits.length() > 19)
                return ResponseEntity.badRequest().body(Map.of("message", "Неверный номер карты"));

            String[] parts = cardExpiry.split("/");
            if (parts.length != 2) return ResponseEntity.badRequest().body(Map.of("message", "Срок действия карты истёк или неверен"));
            try {
                int expMonth = Integer.parseInt(parts[0].trim());
                int expYear = Integer.parseInt(parts[1].trim());
                int fullYear = expYear < 100 ? 2000 + expYear : expYear;
                LocalDate now = LocalDate.now();
                if (expMonth < 1 || expMonth > 12 || fullYear < now.getYear() ||
                    (fullYear == now.getYear() && expMonth < now.getMonthValue()))
                    return ResponseEntity.badRequest().body(Map.of("message", "Срок действия карты истёк или неверен"));
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Срок действия карты истёк или неверен"));
            }

            if (cardCvv.replaceAll("\\D", "").length() < 3)
                return ResponseEntity.badRequest().body(Map.of("message", "Неверный CVV"));
        }

        user.setPlan(plan);
        userRepo.save(user);

        String msg = isTrial ? "Пробный период тарифа " + plan + " активирован" : "Тариф " + plan + " успешно активирован";
        return ResponseEntity.ok(Map.of("plan", plan, "message", msg));
    }

    @PostMapping("/cancel")
    public ResponseEntity<?> cancel(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        userRepo.findById(userId).ifPresent(user -> {
            user.setPlan("free");
            userRepo.save(user);
        });
        return ResponseEntity.ok(Map.of("plan", "free", "message", "Подписка отменена, тариф сброшен на Free"));
    }
}
