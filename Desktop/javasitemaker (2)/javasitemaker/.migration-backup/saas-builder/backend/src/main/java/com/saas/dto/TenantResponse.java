package com.saas.dto;

import com.saas.entity.Tenant;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TenantResponse {
    private UUID id;
    private String name;
    private BusinessType businessType;
    private String databaseName;
    private Tenant.TenantStatus status;
    private LocalDateTime createdAt;

    public static TenantResponse from(Tenant tenant) {
        return TenantResponse.builder()
                .id(tenant.getId())
                .name(tenant.getName())
                .businessType(tenant.getBusinessType())
                .databaseName(tenant.getDatabaseName())
                .status(tenant.getStatus())
                .createdAt(tenant.getCreatedAt())
                .build();
    }
}
