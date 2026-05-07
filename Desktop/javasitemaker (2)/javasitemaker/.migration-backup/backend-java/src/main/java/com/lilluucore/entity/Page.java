package com.lilluucore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "pages")
public class Page {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "site_id", length = 64, nullable = false)
    private String siteId;

    @Column(name = "name", nullable = false, columnDefinition = "text")
    private String name = "Главная";

    @Column(name = "slug", nullable = false, columnDefinition = "text")
    private String slug = "index";

    @Column(name = "position", nullable = false)
    private int position = 0;

    @Column(name = "meta", nullable = false, columnDefinition = "text")
    private String meta = "{}";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public String getMeta() { return meta; }
    public void setMeta(String meta) { this.meta = meta; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
