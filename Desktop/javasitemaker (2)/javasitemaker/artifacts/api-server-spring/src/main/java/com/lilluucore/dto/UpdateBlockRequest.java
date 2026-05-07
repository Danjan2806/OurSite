package com.lilluucore.dto;

public class UpdateBlockRequest {
    private String content;
    private String styles;
    private Boolean visible;
    private Integer width;
    private String rowId;
    private String pageId;
    private Integer position;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getStyles() { return styles; }
    public void setStyles(String styles) { this.styles = styles; }
    public Boolean getVisible() { return visible; }
    public void setVisible(Boolean visible) { this.visible = visible; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public String getRowId() { return rowId; }
    public void setRowId(String rowId) { this.rowId = rowId; }
    public String getPageId() { return pageId; }
    public void setPageId(String pageId) { this.pageId = pageId; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
}
