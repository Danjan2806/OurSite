package com.saas.dto;

import lombok.Data;

@Data
public class UpdateSiteRequest {
    private String name;
    private String globalStyles;
    private String seoMeta;
}
