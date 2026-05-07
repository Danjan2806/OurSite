package com.saas.service;

import com.saas.dto.BusinessType;
import com.saas.entity.Tenant;
import com.saas.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class DynamicDatabaseService {

    @Qualifier("adminDataSource")
    private final DataSource adminDataSource;

    private final TenantRepository tenantRepository;

    /**
     * Creates a new PostgreSQL database for a tenant with isolated user and appropriate schema.
     */
    @Transactional
    public void createTenantDatabase(UUID tenantId, String databaseName, String dbUsername, String dbPassword, BusinessType businessType) {
        log.info("Creating tenant database: {} for tenant: {}", databaseName, tenantId);

        try (Connection conn = adminDataSource.getConnection()) {
            conn.setAutoCommit(true);

            // Create database
            try (Statement stmt = conn.createStatement()) {
                stmt.execute("CREATE DATABASE " + databaseName);
                log.info("Database {} created successfully", databaseName);
            } catch (SQLException e) {
                if (e.getMessage().contains("already exists")) {
                    log.warn("Database {} already exists, skipping creation", databaseName);
                } else {
                    throw e;
                }
            }

            // Create tenant user with limited privileges
            try (Statement stmt = conn.createStatement()) {
                stmt.execute(String.format(
                        "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '%s') THEN CREATE USER %s WITH PASSWORD '%s'; END IF; END $$;",
                        dbUsername, dbUsername, dbPassword
                ));
                log.info("User {} created for tenant database", dbUsername);
            }

            // Grant privileges on the new database
            try (Statement stmt = conn.createStatement()) {
                stmt.execute(String.format("GRANT ALL PRIVILEGES ON DATABASE %s TO %s", databaseName, dbUsername));
                stmt.execute(String.format("GRANT CONNECT ON DATABASE %s TO %s", databaseName, dbUsername));
            }

        } catch (SQLException e) {
            log.error("Failed to create tenant database: {}", databaseName, e);
            updateTenantStatus(tenantId, Tenant.TenantStatus.ERROR);
            throw new RuntimeException("Failed to create tenant database: " + e.getMessage(), e);
        }

        // Run schema migration on the new database
        runSchemaMigration(tenantId, databaseName, dbUsername, dbPassword, businessType);
    }

    private void runSchemaMigration(UUID tenantId, String databaseName, String dbUsername, String dbPassword, BusinessType businessType) {
        String schemaPath = "db-schemas/" + businessType.name().toLowerCase() + "/schema.sql";
        log.info("Running schema migration from: {}", schemaPath);

        String tenantJdbcUrl = buildJdbcUrl(databaseName);

        try {
            String schemaSql = loadSchemaFile(schemaPath);

            com.zaxxer.hikari.HikariConfig config = new com.zaxxer.hikari.HikariConfig();
            config.setJdbcUrl(tenantJdbcUrl);
            config.setUsername(dbUsername);
            config.setPassword(dbPassword);
            config.setMaximumPoolSize(2);
            config.setConnectionTimeout(15000);

            try (com.zaxxer.hikari.HikariDataSource tenantDs = new com.zaxxer.hikari.HikariDataSource(config);
                 Connection conn = tenantDs.getConnection()) {
                conn.setAutoCommit(false);
                try (Statement stmt = conn.createStatement()) {
                    for (String sql : schemaSql.split(";")) {
                        String trimmed = sql.trim();
                        if (!trimmed.isEmpty()) {
                            stmt.execute(trimmed);
                        }
                    }
                    conn.commit();
                    log.info("Schema migration completed for database: {}", databaseName);
                } catch (SQLException e) {
                    conn.rollback();
                    throw e;
                }
            }

            updateTenantStatus(tenantId, Tenant.TenantStatus.ACTIVE);

        } catch (Exception e) {
            log.error("Schema migration failed for database: {}", databaseName, e);
            updateTenantStatus(tenantId, Tenant.TenantStatus.ERROR);
            throw new RuntimeException("Schema migration failed: " + e.getMessage(), e);
        }
    }

    private String loadSchemaFile(String path) throws IOException {
        ClassPathResource resource = new ClassPathResource(path);
        try (InputStream is = resource.getInputStream()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private String buildJdbcUrl(String databaseName) {
        // Extract host and port from admin datasource URL
        // Format: jdbc:postgresql://host:port/dbname
        return "jdbc:postgresql://localhost:5432/" + databaseName;
    }

    private void updateTenantStatus(UUID tenantId, Tenant.TenantStatus status) {
        tenantRepository.findById(tenantId).ifPresent(tenant -> {
            tenant.setStatus(status);
            tenantRepository.save(tenant);
        });
    }

    public String generateDatabaseName(UUID tenantId) {
        return "tenant_" + tenantId.toString().replace("-", "");
    }

    public String generateDbUsername(UUID tenantId) {
        return "user_" + tenantId.toString().replace("-", "").substring(0, 16);
    }

    public String generateDbPassword() {
        return "pwd_" + UUID.randomUUID().toString().replace("-", "");
    }
}
