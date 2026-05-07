package com.saas.repository;

import com.saas.entity.Block;
import com.saas.entity.Site;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BlockRepository extends JpaRepository<Block, UUID> {

    List<Block> findBySiteOrderByPositionAsc(Site site);

    @Query("SELECT COUNT(b) FROM Block b WHERE b.site.id = :siteId")
    int countBySiteId(@Param("siteId") UUID siteId);

    @Modifying
    @Query("DELETE FROM Block b WHERE b.site.id = :siteId")
    void deleteBySiteId(@Param("siteId") UUID siteId);
}
