package com.saas.config;

import com.saas.dto.DatabaseProvisioningEvent;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.support.converter.JsonMessageConverter;

@Configuration
public class KafkaConfig {

    public static final String TOPIC_DB_PROVISION = "db-provisioning";
    public static final String TOPIC_SITE_PUBLISH = "site-publishing";
    public static final String TOPIC_SITE_EVENTS = "site-events";

    @Bean
    public NewTopic dbProvisioningTopic() {
        return TopicBuilder.name(TOPIC_DB_PROVISION)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic sitePublishingTopic() {
        return TopicBuilder.name(TOPIC_SITE_PUBLISH)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic siteEventsTopic() {
        return TopicBuilder.name(TOPIC_SITE_EVENTS)
                .partitions(6)
                .replicas(1)
                .build();
    }

    @Bean
    public JsonMessageConverter jsonMessageConverter() {
        return new JsonMessageConverter();
    }
}
