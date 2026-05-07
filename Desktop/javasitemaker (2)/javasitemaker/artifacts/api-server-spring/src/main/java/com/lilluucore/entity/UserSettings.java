package com.lilluucore.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @Column(name = "user_id", length = 64)
    private String userId;

    @Column(nullable = false)
    private String theme = "dark";

    @Column(nullable = false)
    private boolean notifications = true;

    @Column(name = "email_notifications", nullable = false)
    private boolean emailNotifications = true;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "db_access_locked", nullable = false)
    private boolean dbAccessLocked = false;

    @Column(name = "db_lock_reason")
    private String dbLockReason;

    @Column(name = "seo_settings", columnDefinition = "text")
    private String seoSettings = "{}";

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getTheme() { return theme; }
    public void setTheme(String theme) { this.theme = theme; }
    public boolean isNotifications() { return notifications; }
    public void setNotifications(boolean notifications) { this.notifications = notifications; }
    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public boolean isDbAccessLocked() { return dbAccessLocked; }
    public void setDbAccessLocked(boolean dbAccessLocked) { this.dbAccessLocked = dbAccessLocked; }
    public String getDbLockReason() { return dbLockReason; }
    public void setDbLockReason(String dbLockReason) { this.dbLockReason = dbLockReason; }
    public String getSeoSettings() { return seoSettings; }
    public void setSeoSettings(String seoSettings) { this.seoSettings = seoSettings; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
