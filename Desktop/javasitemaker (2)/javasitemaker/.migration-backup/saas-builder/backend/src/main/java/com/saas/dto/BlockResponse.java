package com.saas.dto;

import com.saas.entity.Block;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class BlockResponse {
    private UUID id;
    private String type;
    private Integer position;
    private String content;
    private String styles;
    private boolean visible;

    public static BlockResponse from(Block block) {
        return BlockResponse.builder()
                .id(block.getId())
                .type(block.getType())
                .position(block.getPosition())
                .content(block.getContent())
                .styles(block.getStyles())
                .visible(block.isVisible())
                .build();
    }
}
