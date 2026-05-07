package com.lilluucore.service;

import com.lilluucore.entity.Notification;
import com.lilluucore.repository.NotificationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private final NotificationRepository notifRepo;

    public NotificationService(NotificationRepository notifRepo) {
        this.notifRepo = notifRepo;
    }

    public List<Notification> getNotifications(String userId) {
        return notifRepo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(String userId) {
        return notifRepo.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAllRead(String userId) {
        notifRepo.markAllReadByUserId(userId);
    }

    @Transactional
    public void markOneRead(String userId, Long id) {
        Notification notif = notifRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        if (!notif.getUserId().equals(userId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        notif.setRead(true);
        notifRepo.save(notif);
    }

    @Transactional
    public Notification create(String userId, String title, String message, String type) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setTitle(title);
        n.setMessage(message);
        n.setType(type != null ? type : "info");
        return notifRepo.save(n);
    }

    @Transactional
    public int broadcast(List<String> userIds, String title, String message, String type) {
        List<Notification> notifs = userIds.stream().map(uid -> {
            Notification n = new Notification();
            n.setUserId(uid);
            n.setTitle(title);
            n.setMessage(message);
            n.setType(type != null ? type : "info");
            return n;
        }).toList();
        notifRepo.saveAll(notifs);
        return notifs.size();
    }
}
