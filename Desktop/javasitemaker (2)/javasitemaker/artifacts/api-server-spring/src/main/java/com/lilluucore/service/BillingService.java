package com.lilluucore.service;

import com.lilluucore.entity.User;
import com.lilluucore.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Calendar;
import java.util.List;
import java.util.Map;

@Service
public class BillingService {

    private static final List<String> VALID_PLANS = List.of("free", "pro", "business");
    private final UserRepository userRepo;

    public BillingService(UserRepository userRepo) {
        this.userRepo = userRepo;
    }

    @Transactional
    public Map<String, Object> subscribe(String userId, Map<String, Object> body) {
        String plan = (String) body.get("plan");
        if (plan == null || !VALID_PLANS.contains(plan))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный тариф");

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if ("free".equals(plan)) {
            user.setPlan("free");
            userRepo.save(user);
            return Map.of("plan", "free", "message", "Тариф изменён на Free");
        }

        Boolean isTrial = (Boolean) body.get("trial");
        if (Boolean.TRUE.equals(isTrial)) {
            user.setPlan(plan);
            userRepo.save(user);
            return Map.of("plan", plan, "message", "Пробный период тарифа " + plan + " активирован");
        }

        String cardNumber = (String) body.get("cardNumber");
        String cardExpiry = (String) body.get("cardExpiry");
        String cardCvv = (String) body.get("cardCvv");
        String cardHolder = (String) body.get("cardHolder");

        if (cardNumber == null || cardExpiry == null || cardCvv == null || cardHolder == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Заполните все поля карты");

        String digits = cardNumber.replaceAll("\\D", "");
        if (digits.length() < 13 || digits.length() > 19)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный номер карты");

        String[] expParts = cardExpiry.split("/");
        if (expParts.length != 2)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Срок действия карты истёк или неверен");
        int expMonth = Integer.parseInt(expParts[0].trim());
        int expYear = Integer.parseInt(expParts[1].trim());
        if (expYear < 100) expYear += 2000;
        Calendar now = Calendar.getInstance();
        int curYear = now.get(Calendar.YEAR);
        int curMonth = now.get(Calendar.MONTH) + 1;
        if (expMonth < 1 || expMonth > 12 || expYear < curYear || (expYear == curYear && expMonth < curMonth))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Срок действия карты истёк или неверен");

        if (cardCvv.replaceAll("\\D", "").length() < 3)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Неверный CVV");

        user.setPlan(plan);
        userRepo.save(user);
        return Map.of("plan", plan, "message", "Тариф " + plan + " успешно активирован");
    }

    @Transactional
    public Map<String, Object> cancel(String userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPlan("free");
        userRepo.save(user);
        return Map.of("plan", "free", "message", "Подписка отменена, тариф сброшен на Free");
    }
}
