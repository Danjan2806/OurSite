package com.saas.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateBlockRequest {
    @NotBlank
    private String type;

    @NotNull
    private Integer position;

    private String content = "{}";
    private String styles = "{}";
}
