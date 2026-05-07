package com.saas.service;

import com.saas.config.KafkaConfig;
import com.saas.dto.CreateTenantRequest;
import com.saas.dto.DatabaseProvisioningEvent;
import com.saas.dto.TenantResponse;
import com.saas.entity.Tenant;
import com.saas.entity.User;
import com.saas.repository.TenantRepository;
import com.saas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final DynamicDatabaseService dynamicDatabaseService;
    private final KafkaTemplate<String, DatabaseProvisioningEvent> kafkaTemplate;

    @Transactional
    public TenantResponse createTenant(CreateTenantRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + ownerEmail));

        UUID tenantId = UUID.randomUUID();
        String databaseName = dynamicDatabaseService.generateDatabaseName(tenantId);
        String dbUsername = dynamicDatabaseService.generateDbUsername(tenantId);
        String dbPassword = dynamicDatabaseService.generateDbPassword();

        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .name(request.getName())
                .businessType(request.getBusinessType())
                .databaseName(databaseName)
                .dbUsername(dbUsername)
                .dbPassword(dbPassword)
                .status(Tenant.TenantStatus.PROVISIONING)
                .owner(owner)
                .build();

        tenant = tenantRepository.save(tenant);
        log.info("Tenant record created: {}, sending provisioning event to Kafka", tenantId);

        // Send to Kafka for async database provisioning
        DatabaseProvisioningEvent event = DatabaseProvisioningEvent.builder()
                .tenantId(tenantId)
                .databaseName(databaseName)
                .dbUsername(dbUsername)
                .dbPassword(dbPassword)
                .businessType(request.getBusinessType())
                .build();

        kafkaTemplate.send(KafkaConfig.TOPIC_DB_PROVISION, tenantId.toString(), event);

        return TenantResponse.from(tenant);
    }

    public TenantResponse getTenant(UUID tenantId, String ownerEmail) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + tenantId));
        validateOwnership(tenant, ownerEmail);
        return TenantResponse.from(tenant);
    }

    public List<TenantResponse> getTenantsForUser(String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + ownerEmail));
        return tenantRepository.findByOwner(owner)
                .stream()
                .map(TenantResponse::from)
                .toList();
    }

    private void validateOwnership(Tenant tenant, String ownerEmail) {
        if (!tenant.getOwner().getEmail().equals(ownerEmail)) {
            throw new RuntimeException("Access denied: tenant does not belong to user");
        }
    }
}
