package com.saas.dto;

import com.saas.entity.Site;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class SiteResponse {
    private UUID id;
    private String name;
    private BusinessType businessType;
    private Site.SiteStatus status;
    private String subdomain;
    private String publishedUrl;
    private String globalStyles;
    private String seoMeta;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BlockResponse> blocks;

    public static SiteResponse from(Site site) {
        return SiteResponse.builder()
                .id(site.getId())
                .name(site.getName())
                .businessType(site.getBusinessType())
                .status(site.getStatus())
                .subdomain(site.getSubdomain())
                .publishedUrl(site.getPublishedUrl())
                .globalStyles(site.getGlobalStyles())
                .seoMeta(site.getSeoMeta())
                .publishedAt(site.getPublishedAt())
                .createdAt(site.getCreatedAt())
                .updatedAt(site.getUpdatedAt())
                .build();
    }
}
