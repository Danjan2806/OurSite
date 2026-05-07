package com.saas.repository;

import com.saas.entity.Site;
import com.saas.entity.Tenant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SiteRepository extends JpaRepository<Site, UUID> {

    List<Site> findByTenantIn(List<Tenant> tenants);

    @Query("SELECT s FROM Site s WHERE s.tenant.owner.id = :userId ORDER BY s.updatedAt DESC")
    List<Site> findByOwnerUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM Site s WHERE s.tenant.owner.id = :userId ORDER BY s.updatedAt DESC")
    Page<Site> findByOwnerUserId(@Param("userId") UUID userId, Pageable pageable);

    Optional<Site> findBySubdomain(String subdomain);

    @Query("SELECT COUNT(s) FROM Site s WHERE s.tenant.owner.id = :userId")
    long countByOwnerUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(s) FROM Site s WHERE s.tenant.owner.id = :userId AND s.status = 'PUBLISHED'")
    long countPublishedByOwnerUserId(@Param("userId") UUID userId);

    @Query("SELECT s FROM Site s WHERE s.tenant.owner.id = :userId AND s.updatedAt >= :since ORDER BY s.updatedAt DESC")
    List<Site> findRecentActivity(@Param("userId") UUID userId, @Param("since") LocalDateTime since);
}
