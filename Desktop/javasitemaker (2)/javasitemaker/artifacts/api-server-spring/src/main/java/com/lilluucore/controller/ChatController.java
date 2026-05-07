package com.lilluucore.controller;

import com.lilluucore.service.AdminService;
import com.lilluucore.service.ChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
public class ChatController {

    private final ChatService chatService;
    private final AdminService adminService;

    public ChatController(ChatService chatService, AdminService adminService) {
        this.chatService = chatService;
        this.adminService = adminService;
    }

    @GetMapping("/chat/unread-count")
    public ResponseEntity<?> getUnreadCount(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(Map.of("count", chatService.getUnreadCount(userId)));
    }

    @GetMapping("/chat/support-thread")
    public ResponseEntity<?> getSupportThread(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(chatService.getSupportThread(userId));
    }

    @PostMapping("/chat/to-support")
    public ResponseEntity<?> sendToSupport(@AuthenticationPrincipal String userId,
                                            @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(chatService.sendToSupport(
                userId, (String) body.get("message"), (String) body.get("imageUrl")));
    }

    @GetMapping("/chat/{withUserId}")
    public ResponseEntity<?> getConversation(@AuthenticationPrincipal String userId,
                                              @PathVariable String withUserId) {
        return ResponseEntity.ok(chatService.getConversation(userId, withUserId));
    }

    @PostMapping("/chat/{toUserId}")
    public ResponseEntity<?> sendMessage(@AuthenticationPrincipal String userId,
                                          @PathVariable String toUserId,
                                          @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(chatService.sendMessage(
                userId, toUserId, (String) body.get("message"), (String) body.get("imageUrl")));
    }

    @GetMapping("/admin/chat/conversations")
    public ResponseEntity<?> getConversations(@AuthenticationPrincipal String staffId) {
        adminService.requireStaff(staffId);
        return ResponseEntity.ok(chatService.getConversations(staffId));
    }
}
