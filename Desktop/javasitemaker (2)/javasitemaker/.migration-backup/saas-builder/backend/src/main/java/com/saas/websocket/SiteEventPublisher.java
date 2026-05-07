package com.saas.websocket;

import com.saas.dto.BlockResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SiteEventPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void publishBlockAdded(UUID siteId, BlockResponse block) {
        send(siteId, Map.of("event", "BLOCK_ADDED", "block", block));
    }

    public void publishBlockUpdated(UUID siteId, BlockResponse block) {
        send(siteId, Map.of("event", "BLOCK_UPDATED", "block", block));
    }

    public void publishBlockDeleted(UUID siteId, UUID blockId) {
        send(siteId, Map.of("event", "BLOCK_DELETED", "blockId", blockId));
    }

    public void publishBlocksReordered(UUID siteId, List<BlockResponse> blocks) {
        send(siteId, Map.of("event", "BLOCKS_REORDERED", "blocks", blocks));
    }

    public void publishStyleUpdate(UUID siteId, String globalStyles) {
        send(siteId, Map.of("event", "STYLES_UPDATED", "globalStyles", globalStyles));
    }

    public void publishSitePublished(UUID siteId, String url) {
        send(siteId, Map.of("event", "SITE_PUBLISHED", "url", url));
    }

    private void send(UUID siteId, Object payload) {
        String destination = "/topic/site/" + siteId;
        try {
            messagingTemplate.convertAndSend(destination, payload);
            log.debug("WebSocket event sent to {}: {}", destination, payload);
        } catch (Exception e) {
            log.error("Failed to send WebSocket event to {}: {}", destination, e.getMessage());
        }
    }
}
