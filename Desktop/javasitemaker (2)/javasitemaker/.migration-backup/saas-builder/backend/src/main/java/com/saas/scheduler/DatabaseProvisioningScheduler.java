package com.saas.scheduler;

import com.saas.config.KafkaConfig;
import com.saas.dto.DatabaseProvisioningEvent;
import com.saas.entity.Tenant;
import com.saas.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Retries failed tenant database provisioning periodically.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class DatabaseProvisioningScheduler {

    private final TenantRepository tenantRepository;
    private final KafkaTemplate<String, DatabaseProvisioningEvent> kafkaTemplate;

    @Scheduled(fixedDelay = 300000) // every 5 minutes
    public void retryFailedProvisionings() {
        List<Tenant> failedTenants = tenantRepository.findAll().stream()
                .filter(t -> t.getStatus() == Tenant.TenantStatus.PROVISIONING ||
                             t.getStatus() == Tenant.TenantStatus.ERROR)
                .toList();

        if (!failedTenants.isEmpty()) {
            log.info("Retrying provisioning for {} tenants", failedTenants.size());
        }

        for (Tenant tenant : failedTenants) {
            log.info("Retrying DB provisioning for tenant: {}", tenant.getId());
            DatabaseProvisioningEvent event = DatabaseProvisioningEvent.builder()
                    .tenantId(tenant.getId())
                    .databaseName(tenant.getDatabaseName())
                    .dbUsername(tenant.getDbUsername())
                    .dbPassword(tenant.getDbPassword())
                    .businessType(tenant.getBusinessType())
                    .build();
            kafkaTemplate.send(KafkaConfig.TOPIC_DB_PROVISION, tenant.getId().toString(), event);
        }
    }
}
