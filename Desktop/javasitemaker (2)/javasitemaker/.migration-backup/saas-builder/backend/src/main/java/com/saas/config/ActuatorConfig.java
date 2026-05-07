package com.saas.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;

@Configuration
public class ActuatorConfig {

    @Bean
    @ConditionalOnMissingBean(name = "customHealthIndicator")
    public HealthIndicator customHealthIndicator() {
        return () -> Health.up()
                .withDetail("app", "SaaS Builder")
                .withDetail("status", "running")
                .build();
    }
}
