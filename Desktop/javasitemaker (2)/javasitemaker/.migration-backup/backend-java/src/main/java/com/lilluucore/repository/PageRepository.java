package com.lilluucore.repository;

import com.lilluucore.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PageRepository extends JpaRepository<Page, String> {
    List<Page> findBySiteIdOrderByPositionAsc(String siteId);
    long countBySiteId(String siteId);
}
