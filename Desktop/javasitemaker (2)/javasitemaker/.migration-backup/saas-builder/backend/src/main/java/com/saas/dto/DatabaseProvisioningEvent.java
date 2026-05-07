package com.saas.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DatabaseProvisioningEvent {
    private UUID tenantId;
    private String databaseName;
    private String dbUsername;
    private String dbPassword;
    private BusinessType businessType;
}
