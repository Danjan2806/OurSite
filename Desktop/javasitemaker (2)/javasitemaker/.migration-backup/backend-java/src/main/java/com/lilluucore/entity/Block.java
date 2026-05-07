package com.lilluucore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "blocks")
public class Block {

    @Id
    @Column(name = "id", length = 64)
    private String id;

    @Column(name = "site_id", length = 64, nullable = false)
    private String siteId;

    @Column(name = "page_id", length = 64)
    private String pageId;

    @Column(name = "type", nullable = false, columnDefinition = "text")
    private String type;

    @Column(name = "position", nullable = false)
    private int position = 0;

    @Column(name = "row_id", columnDefinition = "text")
    private String rowId;

    @Column(name = "content", nullable = false, columnDefinition = "text")
    private String content = "{}";

    @Column(name = "styles", nullable = false, columnDefinition = "text")
    private String styles = "{}";

    @Column(name = "visible", nullable = false)
    private boolean visible = true;

    @Column(name = "width", nullable = false)
    private int width = 100;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

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
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
