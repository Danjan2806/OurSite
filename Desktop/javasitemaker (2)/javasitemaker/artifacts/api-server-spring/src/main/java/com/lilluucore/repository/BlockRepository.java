package com.lilluucore.repository;

import com.lilluucore.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, String> {
    List<Block> findBySiteIdOrderByPositionAsc(String siteId);
    List<Block> findByPageIdOrderByPositionAsc(String pageId);
    Optional<Block> findByIdAndSiteId(String id, String siteId);
    void deleteByPageId(String pageId);
    long countBySiteId(String siteId);
}
