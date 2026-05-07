package com.lilluucore.repository;

import com.lilluucore.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.fromUserId = :userId AND m.toUserId IN :staffIds)
           OR (m.toUserId = :userId AND m.fromUserId IN :staffIds)
        ORDER BY m.createdAt ASC
    """)
    List<ChatMessage> findSupportThread(String userId, List<String> staffIds);

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.fromUserId IN :staffIds AND m.toUserId = :userId)
           OR (m.fromUserId = :userId AND m.toUserId IN :staffIds)
        ORDER BY m.createdAt ASC
    """)
    List<ChatMessage> findConversationAsStaff(String userId, List<String> staffIds);

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.fromUserId = :a AND m.toUserId = :b)
           OR (m.fromUserId = :b AND m.toUserId = :a)
        ORDER BY m.createdAt ASC
    """)
    List<ChatMessage> findDirectConversation(String a, String b);

    @Modifying @Transactional
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.toUserId = :toUserId AND m.fromUserId IN :fromIds")
    void markReadFrom(String toUserId, List<String> fromIds);

    @Modifying @Transactional
    @Query("UPDATE ChatMessage m SET m.read = true WHERE m.toUserId = :toUserId AND m.fromUserId = :fromUserId")
    void markReadFromUser(String toUserId, String fromUserId);

    long countByToUserIdAndReadFalse(String toUserId);

    @Query("""
        SELECT DISTINCT m.toUserId FROM ChatMessage m WHERE m.fromUserId IN :staffIds
        UNION
        SELECT DISTINCT m.fromUserId FROM ChatMessage m WHERE m.toUserId IN :staffIds
    """)
    List<String> findDistinctUserIds(List<String> staffIds);

    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.toUserId IN :staffIds AND m.fromUserId = :fromUserId AND m.read = false")
    long countUnreadFrom(List<String> staffIds, String fromUserId);
}
