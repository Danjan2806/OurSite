package com.lilluucore.repository;

import com.lilluucore.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    long countByToUserIdAndReadFalse(String toUserId);

    @Query("SELECT m FROM ChatMessage m WHERE (m.fromUserId = :userId AND m.toUserId = :other) OR (m.fromUserId = :other AND m.toUserId = :userId) ORDER BY m.createdAt ASC")
    List<ChatMessage> findConversation(String userId, String other);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.toUserId = :userId AND m.fromUserId = :fromUserId")
    void markReadBetween(String userId, String fromUserId);

    @Query("SELECT m FROM ChatMessage m WHERE (m.fromUserId = :userId AND m.toUserId IN :staffIds) OR (m.toUserId = :userId AND m.fromUserId IN :staffIds) ORDER BY m.createdAt ASC")
    List<ChatMessage> findSupportThread(String userId, List<String> staffIds);

    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.toUserId = :userId AND m.fromUserId IN :staffIds")
    void markStaffMessagesRead(String userId, List<String> staffIds);

    @Query("SELECT m FROM ChatMessage m WHERE m.fromUserId = :userId AND m.toUserId IN :staffIds ORDER BY m.createdAt ASC")
    List<ChatMessage> findExistingStaffContact(String userId, List<String> staffIds);
}
