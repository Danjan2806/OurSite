package com.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateTenantRequest {
    @NotBlank
    private String name;

    @NotNull
    private BusinessType businessType;
}
