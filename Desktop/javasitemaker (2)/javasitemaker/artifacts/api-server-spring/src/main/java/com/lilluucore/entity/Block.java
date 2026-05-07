package com.lilluucore.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "blocks")
public class Block {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "site_id", nullable = false, length = 64)
    private String siteId;

    @Column(name = "page_id", length = 64)
    private String pageId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private int position = 0;

    @Column(name = "row_id")
    private String rowId;

    @Column(nullable = false, columnDefinition = "text")
    private String content = "{}";

    @Column(nullable = false, columnDefinition = "text")
    private String styles = "{}";

    @Column(nullable = false)
    private boolean visible = true;

    @Column(nullable = false)
    private int width = 100;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }
    public String getPageId() { return pageId; }
    public void setPageId(String pageId) { this.pageId = pageId; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }
    public String getRowId() { return rowId; }
    public void setRowId(String rowId) { this.rowId = rowId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getStyles() { return styles; }
    public void setStyles(String styles) { this.styles = styles; }
    public boolean isVisible() { return visible; }
    public void setVisible(boolean visible) { this.visible = visible; }
    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
