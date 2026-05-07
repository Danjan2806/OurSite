package com.lilluucore.controller;

import com.lilluucore.entity.*;
import com.lilluucore.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notifRepo;

    public ChatController(ChatMessageRepository chatRepo, UserRepository userRepo,
                          NotificationRepository notifRepo) {
        this.chatRepo = chatRepo;
        this.userRepo = userRepo;
        this.notifRepo = notifRepo;
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        return ResponseEntity.ok(Map.of("count", chatRepo.countByToUserIdAndReadFalse(userId)));
    }

    @GetMapping("/support-thread")
    public ResponseEntity<?> supportThread(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        List<User> staff = userRepo.findStaff();
        if (staff.isEmpty()) return ResponseEntity.ok(Map.of("messages", List.of(), "staffIds", List.of()));

        List<String> staffIds = staff.stream().map(User::getId).toList();
        List<ChatMessage> messages = chatRepo.findSupportThread(userId, staffIds);

        chatRepo.markStaffMessagesRead(userId, staffIds);

        Set<String> allUserIds = messages.stream()
            .flatMap(m -> Stream.of(m.getFromUserId(), m.getToUserId()))
            .collect(Collectors.toSet());

        Map<String, User> userMap = userRepo.findAllById(allUserIds).stream()
            .collect(Collectors.toMap(User::getId, u -> u));

        List<Map<String, Object>> enriched = messages.stream().map(m -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("fromUserId", m.getFromUserId());
            map.put("toUserId", m.getToUserId());
            map.put("message", m.getMessage());
            map.put("imageUrl", m.getImageUrl());
            map.put("ticketId", m.getTicketId());
            map.put("read", m.isRead());
            map.put("createdAt", m.getCreatedAt());
            User from = userMap.get(m.getFromUserId());
            if (from != null) {
                map.put("fromUser", Map.of("id", from.getId(), "firstName", from.getFirstName(),
                    "lastName", from.getLastName(), "role", from.getRole()));
            } else {
                map.put("fromUser", null);
            }
            return map;
        }).toList();

        return ResponseEntity.ok(Map.of("messages", enriched, "staffIds", staffIds));
    }

    @PostMapping("/to-support")
    public ResponseEntity<?> toSupport(@AuthenticationPrincipal String userId,
                                       @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String message = (String) body.get("message");
        String imageUrl = (String) body.get("imageUrl");
        if ((message == null || message.isBlank()) && imageUrl == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Сообщение не может быть пустым"));

        List<User> staff = userRepo.findStaff();
        if (staff.isEmpty()) return ResponseEntity.status(503).body(Map.of("message", "Сотрудники поддержки недоступны"));

        List<String> staffIds = staff.stream().map(User::getId).toList();
        List<ChatMessage> existing = chatRepo.findExistingStaffContact(userId, staffIds);

        String targetStaffId = existing.isEmpty()
            ? staff.stream().filter(s -> "moderator".equals(s.getRole())).findFirst()
                .map(User::getId).orElse(staff.get(0).getId())
            : existing.get(0).getToUserId();

        ChatMessage msg = new ChatMessage();
        msg.setFromUserId(userId);
        msg.setToUserId(targetStaffId);
        msg.setMessage(message != null ? message.trim() : "");
        msg.setImageUrl(imageUrl);
        chatRepo.save(msg);

        userRepo.findById(userId).ifPresent(sender -> {
            String senderName = (sender.getFirstName() + " " + sender.getLastName()).trim();
            Notification n = new Notification();
            n.setUserId(targetStaffId);
            n.setType("info");
            n.setTitle("Новое сообщение в поддержке");
            n.setMessage(senderName + ": " + (message != null ? message.trim() : "[изображение]").substring(0, Math.min(120, (message != null ? message.trim() : "[изображение]").length())));
            notifRepo.save(n);
        });

        return ResponseEntity.ok(msg);
    }

    @GetMapping("/{withUserId}")
    public ResponseEntity<?> getConversation(@AuthenticationPrincipal String userId,
                                             @PathVariable String withUserId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        List<ChatMessage> messages = chatRepo.findConversation(userId, withUserId);
        chatRepo.markReadBetween(userId, withUserId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("/{toUserId}")
    public ResponseEntity<?> send(@AuthenticationPrincipal String userId,
                                  @PathVariable String toUserId,
                                  @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String message = (String) body.get("message");
        String imageUrl = (String) body.get("imageUrl");
        if ((message == null || message.isBlank()) && imageUrl == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Сообщение не может быть пустым"));

        Optional<User> target = userRepo.findById(toUserId);
        if (target.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Пользователь не найден"));

        ChatMessage msg = new ChatMessage();
        msg.setFromUserId(userId);
        msg.setToUserId(toUserId);
        msg.setMessage(message != null ? message.trim() : "");
        msg.setImageUrl(imageUrl);
        chatRepo.save(msg);

        userRepo.findById(userId).ifPresent(sender -> {
            if ("admin".equals(sender.getRole()) || "moderator".equals(sender.getRole())) {
                String staffName = (sender.getFirstName() + " " + sender.getLastName()).trim();
                Notification n = new Notification();
                n.setUserId(toUserId);
                n.setType("info");
                n.setTitle("Ответ от поддержки");
                String preview = message != null ? message.trim() : "[изображение]";
                n.setMessage(staffName + ": " + preview.substring(0, Math.min(120, preview.length())));
                notifRepo.save(n);
            }
        });

        return ResponseEntity.ok(msg);
    }
}
