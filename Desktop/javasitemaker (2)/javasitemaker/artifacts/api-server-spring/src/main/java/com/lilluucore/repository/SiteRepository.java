package com.lilluucore.repository;

import com.lilluucore.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SiteRepository extends JpaRepository<Site, String> {
    List<Site> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Site> findByIdAndUserId(String id, String userId);
    List<Site> findAllByOrderByUpdatedAtDesc();
}
