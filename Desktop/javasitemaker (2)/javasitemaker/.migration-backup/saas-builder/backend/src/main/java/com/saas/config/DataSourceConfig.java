package com.saas.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Value("${spring.datasource-admin.url}")
    private String adminUrl;

    @Value("${spring.datasource-admin.username}")
    private String adminUsername;

    @Value("${spring.datasource-admin.password}")
    private String adminPassword;

    @Bean(name = "adminDataSource")
    public DataSource adminDataSource() {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(adminUrl);
        config.setUsername(adminUsername);
        config.setPassword(adminPassword);
        config.setMaximumPoolSize(5);
        config.setConnectionTimeout(30000);
        config.setPoolName("admin-pool");
        return new HikariDataSource(config);
    }
}
