package com.lilluucore.dto;

public class CreateBlockRequest {
    private String type;
    private Integer position;
    private Integer width;
    private String pageId;
    private String rowId;
    private String content;
    private String styles;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public String getPageId() { return pageId; }
    public void setPageId(String pageId) { this.pageId = pageId; }
    public String getRowId() { return rowId; }
    public void setRowId(String rowId) { this.rowId = rowId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getStyles() { return styles; }
    public void setStyles(String styles) { this.styles = styles; }
}
