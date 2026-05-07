package com.lilluucore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sites")
public class Site {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;

    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name;

    @Column(name = "subdomain", nullable = false, columnDefinition = "text")
    private String subdomain;

    @Column(name = "business_type", nullable = false, columnDefinition = "text")
    private String businessType;

    @Column(name = "status", nullable = false, columnDefinition = "text")
    private String status = "DRAFT";

    @Column(name = "published_url", columnDefinition = "text")
    private String publishedUrl;

    @Column(name = "global_styles", nullable = false, columnDefinition = "text")
    private String globalStyles = "{}";

    @Column(name = "frozen", nullable = false)
    private boolean frozen = false;

    @Column(name = "frozen_reason", columnDefinition = "text")
    private String frozenReason;

    @Column(name = "frozen_by", length = 64)
    private String frozenBy;

    @Column(name = "frozen_at")
    private Instant frozenAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPublishedUrl() { return publishedUrl; }
    public void setPublishedUrl(String publishedUrl) { this.publishedUrl = publishedUrl; }
    public String getGlobalStyles() { return globalStyles; }
    public void setGlobalStyles(String globalStyles) { this.globalStyles = globalStyles; }
    public boolean isFrozen() { return frozen; }
    public void setFrozen(boolean frozen) { this.frozen = frozen; }
    public String getFrozenReason() { return frozenReason; }
    public void setFrozenReason(String frozenReason) { this.frozenReason = frozenReason; }
    public String getFrozenBy() { return frozenBy; }
    public void setFrozenBy(String frozenBy) { this.frozenBy = frozenBy; }
    public Instant getFrozenAt() { return frozenAt; }
    public void setFrozenAt(Instant frozenAt) { this.frozenAt = frozenAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
