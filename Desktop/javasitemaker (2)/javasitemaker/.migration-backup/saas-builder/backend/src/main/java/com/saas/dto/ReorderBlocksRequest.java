package com.saas.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class ReorderBlocksRequest {
    @NotNull
    private List<UUID> blockIds;
}
