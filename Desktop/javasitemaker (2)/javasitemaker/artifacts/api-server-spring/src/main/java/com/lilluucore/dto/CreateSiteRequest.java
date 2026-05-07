package com.lilluucore.dto;

import jakarta.validation.constraints.NotBlank;

public class CreateSiteRequest {
    @NotBlank
    private String name;
    private String subdomain;
    @NotBlank
    private String businessType;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSubdomain() { return subdomain; }
    public void setSubdomain(String subdomain) { this.subdomain = subdomain; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
}
