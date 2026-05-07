package com.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class CreateSiteRequest {
    @NotBlank
    private String name;

    @NotNull
    private BusinessType businessType;

    @NotNull
    private UUID tenantId;
}
