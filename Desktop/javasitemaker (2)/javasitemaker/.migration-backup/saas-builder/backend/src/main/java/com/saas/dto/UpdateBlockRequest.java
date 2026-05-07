package com.saas.dto;

import lombok.Data;

@Data
public class UpdateBlockRequest {
    private String content;
    private String styles;
    private Integer position;
    private Boolean visible;
}
