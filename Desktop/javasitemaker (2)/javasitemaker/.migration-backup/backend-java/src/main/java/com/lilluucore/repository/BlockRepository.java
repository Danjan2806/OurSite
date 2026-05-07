package com.lilluucore.repository;

import com.lilluucore.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface BlockRepository extends JpaRepository<Block, String> {
    List<Block> findBySiteIdOrderByPositionAsc(String siteId);
    long countBySiteId(String siteId);

    @Transactional
    void deleteByPageId(String pageId);
}
