package com.lilluucore.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "form_submissions")
public class FormSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "site_id", length = 64, nullable = false)
    private String siteId;

    @Column(name = "block_id", length = 64)
    private String blockId;

    @Column(name = "form_title", nullable = false, columnDefinition = "text")
    private String formTitle = "Заявка";

    @Column(name = "data", nullable = false, columnDefinition = "text")
    private String data = "{}";

    @Column(name = "submitter_ip", columnDefinition = "text")
    private String submitterIp;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSiteId() { return siteId; }
    public void setSiteId(String siteId) { this.siteId = siteId; }
    public String getBlockId() { return blockId; }
    public void setBlockId(String blockId) { this.blockId = blockId; }
    public String getFormTitle() { return formTitle; }
    public void setFormTitle(String formTitle) { this.formTitle = formTitle; }
    public String getData() { return data; }
    public void setData(String data) { this.data = data; }
    public String getSubmitterIp() { return submitterIp; }
    public void setSubmitterIp(String submitterIp) { this.submitterIp = submitterIp; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
