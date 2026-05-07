package com.saas.controller;

import com.saas.dto.CreateSiteRequest;
import com.saas.dto.SiteResponse;
import com.saas.dto.UpdateSiteRequest;
import com.saas.service.PublishService;
import com.saas.service.SiteBuilderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/sites")
@RequiredArgsConstructor
public class SiteController {

    private final SiteBuilderService siteBuilderService;
    private final PublishService publishService;

    @PostMapping
    public ResponseEntity<SiteResponse> createSite(
            @Valid @RequestBody CreateSiteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        SiteResponse response = siteBuilderService.createSite(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SiteResponse>> getMySites(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.getAllSitesForUser(userDetails.getUsername()));
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<SiteResponse>> getMySitesPaged(
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.getSitesForUser(userDetails.getUsername(), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SiteResponse> getSite(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.getSite(id, userDetails.getUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SiteResponse> updateSite(
            @PathVariable UUID id,
            @RequestBody UpdateSiteRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.updateSite(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSite(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        siteBuilderService.deleteSite(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<Map<String, String>> publishSite(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) throws IOException {
        String url = publishService.publishSite(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("url", url, "status", "published"));
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.getDashboardStats(userDetails.getUsername()));
    }
}
