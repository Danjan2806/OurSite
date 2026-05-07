package com.saas.kafka;

import com.saas.config.KafkaConfig;
import com.saas.dto.DatabaseProvisioningEvent;
import com.saas.service.DynamicDatabaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseProvisioningConsumer {

    private final DynamicDatabaseService dynamicDatabaseService;

    @KafkaListener(
            topics = KafkaConfig.TOPIC_DB_PROVISION,
            groupId = "saas-builder-group",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void handleDatabaseProvisioning(
            @Payload DatabaseProvisioningEvent event,
            @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
            @Header(KafkaHeaders.OFFSET) long offset
    ) {
        log.info("Received DB provisioning event for tenant: {}, partition: {}, offset: {}",
                event.getTenantId(), partition, offset);

        try {
            dynamicDatabaseService.createTenantDatabase(
                    event.getTenantId(),
                    event.getDatabaseName(),
                    event.getDbUsername(),
                    event.getDbPassword(),
                    event.getBusinessType()
            );
            log.info("Successfully provisioned database for tenant: {}", event.getTenantId());
        } catch (Exception e) {
            log.error("Failed to provision database for tenant: {}", event.getTenantId(), e);
            // Dead-letter queue handling could go here
        }
    }
}
