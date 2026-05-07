package com.lilluucore.service;

import com.lilluucore.entity.ChatMessage;
import com.lilluucore.entity.User;
import com.lilluucore.repository.ChatMessageRepository;
import com.lilluucore.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class ChatService {

    private final ChatMessageRepository msgRepo;
    private final UserRepository userRepo;
    private final NotificationService notifService;

    public ChatService(ChatMessageRepository msgRepo, UserRepository userRepo,
                       NotificationService notifService) {
        this.msgRepo = msgRepo;
        this.userRepo = userRepo;
        this.notifService = notifService;
    }

    public long getUnreadCount(String userId) {
        return msgRepo.countByToUserIdAndReadFalse(userId);
    }

    @Transactional
    public Map<String, Object> getSupportThread(String userId) {
        List<User> staff = userRepo.findAllStaff();
        if (staff.isEmpty()) return Map.of("messages", List.of(), "staffIds", List.of());
        List<String> staffIds = staff.stream().map(User::getId).toList();

        List<ChatMessage> messages = msgRepo.findSupportThread(userId, staffIds);
        msgRepo.markReadFrom(userId, staffIds);

        List<String> allIds = new ArrayList<>();
        for (ChatMessage m : messages) { allIds.add(m.getFromUserId()); allIds.add(m.getToUserId()); }
        List<User> users = allIds.isEmpty() ? List.of() : userRepo.findAllById(new HashSet<>(allIds));
        Map<String, User> userMap = new HashMap<>();
        for (User u : users) userMap.put(u.getId(), u);

        List<Map<String, Object>> enriched = messages.stream().map(m -> {
            Map<String, Object> msg = new LinkedHashMap<>();
            msg.put("id", m.getId()); msg.put("fromUserId", m.getFromUserId());
            msg.put("toUserId", m.getToUserId()); msg.put("message", m.getMessage());
            msg.put("imageUrl", m.getImageUrl()); msg.put("ticketId", m.getTicketId());
            msg.put("read", m.isRead()); msg.put("createdAt", m.getCreatedAt());
            User sender = userMap.get(m.getFromUserId());
            if (sender != null) msg.put("fromUser", Map.of(
                    "id", sender.getId(), "firstName", sender.getFirstName(),
                    "lastName", sender.getLastName(), "role", sender.getRole()));
            return msg;
        }).toList();

        return Map.of("messages", enriched, "staffIds", staffIds);
    }

    @Transactional
    public ChatMessage sendToSupport(String userId, String message, String imageUrl) {
        if ((message == null || message.isBlank()) && (imageUrl == null || imageUrl.isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сообщение не может быть пустым");

        List<User> staff = userRepo.findAllStaff();
        if (staff.isEmpty())
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Сотрудники поддержки недоступны");

        List<String> staffIds = staff.stream().map(User::getId).toList();
        String targetStaffId = staff.stream()
                .filter(s -> "moderator".equals(s.getRole())).map(User::getId).findFirst()
                .orElse(staff.get(0).getId());

        ChatMessage msg = new ChatMessage();
        msg.setFromUserId(userId);
        msg.setToUserId(targetStaffId);
        msg.setMessage(message != null ? message.trim() : "");
        msg.setImageUrl(imageUrl);
        ChatMessage saved = msgRepo.save(msg);

        userRepo.findById(userId).ifPresent(sender -> {
            String name = String.join(" ", sender.getFirstName(), sender.getLastName()).trim();
            notifService.create(targetStaffId, "Новое сообщение в поддержке",
                    name + ": " + (message != null ? message.trim().substring(0, Math.min(120, message.trim().length())) : "[изображение]"),
                    "info");
        });
        return saved;
    }

    @Transactional
    public List<ChatMessage> getConversation(String userId, String otherId) {
        User currentUser = userRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        boolean isStaff = "admin".equals(currentUser.getRole()) || "moderator".equals(currentUser.getRole());

        List<ChatMessage> messages;
        if (isStaff) {
            List<String> allStaffIds = userRepo.findAllStaff().stream().map(User::getId).toList();
            messages = msgRepo.findConversationAsStaff(otherId, allStaffIds);
            msgRepo.markReadFromUser(userId, otherId);
        } else {
            messages = msgRepo.findDirectConversation(userId, otherId);
            msgRepo.markReadFromUser(userId, otherId);
        }
        return messages;
    }

    @Transactional
    public ChatMessage sendMessage(String userId, String toUserId, String message, String imageUrl) {
        if ((message == null || message.isBlank()) && (imageUrl == null || imageUrl.isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Сообщение не может быть пустым");

        userRepo.findById(toUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Пользователь не найден"));

        ChatMessage msg = new ChatMessage();
        msg.setFromUserId(userId);
        msg.setToUserId(toUserId);
        msg.setMessage(message != null ? message.trim() : "");
        msg.setImageUrl(imageUrl);
        ChatMessage saved = msgRepo.save(msg);

        userRepo.findById(userId).ifPresent(sender -> {
            boolean senderIsStaff = "admin".equals(sender.getRole()) || "moderator".equals(sender.getRole());
            if (senderIsStaff) {
                String name = String.join(" ", sender.getFirstName(), sender.getLastName()).trim();
                notifService.create(toUserId, "Ответ от поддержки",
                        name + ": " + (message != null ? message.trim().substring(0, Math.min(120, message.trim().length())) : "[изображение]"),
                        "info");
            }
        });
        return saved;
    }

    public List<Map<String, Object>> getConversations(String staffId) {
        List<String> allStaffIds = userRepo.findAllStaff().stream().map(User::getId).toList();
        List<String> userIds = msgRepo.findDistinctUserIds(allStaffIds).stream()
                .filter(id -> !allStaffIds.contains(id)).distinct().toList();

        List<User> users = userIds.isEmpty() ? List.of() : userRepo.findAllById(userIds);
        return users.stream().map(u -> {
            long unread = msgRepo.countUnreadFrom(allStaffIds, u.getId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", u.getId()); m.put("firstName", u.getFirstName());
            m.put("lastName", u.getLastName()); m.put("email", u.getEmail());
            m.put("role", u.getRole()); m.put("unread", unread);
            m.put("shortUserId", "USR-" + u.getId().substring(0, Math.min(8, u.getId().length())).toUpperCase());
            return m;
        }).toList();
    }
}
