package com.lilluucore.repository;

import com.lilluucore.entity.FormSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FormSubmissionRepository extends JpaRepository<FormSubmission, Long> {
    List<FormSubmission> findBySiteIdOrderByCreatedAtDesc(String siteId);
}
