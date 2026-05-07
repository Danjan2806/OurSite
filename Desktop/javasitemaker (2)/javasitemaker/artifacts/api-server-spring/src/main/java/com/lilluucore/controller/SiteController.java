package com.lilluucore.controller;

import com.lilluucore.dto.ApiError;
import com.lilluucore.dto.CreateBlockRequest;
import com.lilluucore.dto.CreatePageRequest;
import com.lilluucore.dto.CreateSiteRequest;
import com.lilluucore.dto.UpdateBlockRequest;
import com.lilluucore.service.SiteService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class SiteController {

    private final SiteService siteService;

    public SiteController(SiteService siteService) {
        this.siteService = siteService;
    }

    @GetMapping("/sites")
    public ResponseEntity<?> getSites(@AuthenticationPrincipal String userId) {
        return ResponseEntity.ok(siteService.getSitesForUser(userId));
    }

    @GetMapping("/sites/stats/all")
    public ResponseEntity<?> getAllStats(@AuthenticationPrincipal String userId,
                                          @RequestParam(required = false) String period) {
        return ResponseEntity.ok(siteService.getAllStats(userId, period));
    }

    @PostMapping("/sites")
    public ResponseEntity<?> createSite(@AuthenticationPrincipal String userId,
                                         @Valid @RequestBody CreateSiteRequest req) {
        return ResponseEntity.status(201).body(siteService.createSite(userId, req));
    }

    @GetMapping("/sites/{id}")
    public ResponseEntity<?> getSite(@AuthenticationPrincipal String userId,
                                      @PathVariable String id) {
        return ResponseEntity.ok(siteService.getSite(userId, id));
    }

    @GetMapping("/sites/{id}/stats")
    public ResponseEntity<?> getSiteStats(@AuthenticationPrincipal String userId,
                                           @PathVariable String id,
                                           @RequestParam(required = false) String period) {
        return ResponseEntity.ok(siteService.getStats(userId, id, period));
    }

    @DeleteMapping("/sites/{id}")
    public ResponseEntity<?> deleteSite(@AuthenticationPrincipal String userId,
                                         @PathVariable String id) {
        siteService.deleteSite(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sites/{id}/publish")
    public ResponseEntity<?> publishSite(@AuthenticationPrincipal String userId,
                                          @PathVariable String id) {
        return ResponseEntity.ok(siteService.publishSite(userId, id));
    }

    @PutMapping("/sites/{id}/styles")
    public ResponseEntity<?> updateStyles(@AuthenticationPrincipal String userId,
                                           @PathVariable String id,
                                           @RequestBody Map<String, Object> body) {
        String styles = body.containsKey("globalStyles")
                ? (String) body.get("globalStyles")
                : (String) body.get("styles");
        siteService.updateStyles(userId, id, styles);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/sites/{id}/pages")
    public ResponseEntity<?> getPages(@AuthenticationPrincipal String userId,
                                       @PathVariable String id) {
        return ResponseEntity.ok(siteService.getPages(userId, id));
    }

    @PostMapping("/sites/{id}/pages")
    public ResponseEntity<?> createPage(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @RequestBody CreatePageRequest req) {
        return ResponseEntity.status(201).body(siteService.createPage(userId, id, req));
    }

    @PutMapping("/sites/{id}/pages/{pageId}")
    public ResponseEntity<?> updatePage(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @PathVariable String pageId,
                                         @RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(siteService.updatePage(userId, id, pageId, body));
    }

    @DeleteMapping("/sites/{id}/pages/{pageId}")
    public ResponseEntity<?> deletePage(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @PathVariable String pageId) {
        siteService.deletePage(userId, id, pageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/sites/{id}/blocks")
    public ResponseEntity<?> createBlock(@AuthenticationPrincipal String userId,
                                          @PathVariable String id,
                                          @RequestBody CreateBlockRequest req) {
        return ResponseEntity.status(201).body(siteService.createBlock(userId, id, req));
    }

    @PutMapping("/sites/{id}/blocks/{blockId}")
    public ResponseEntity<?> updateBlock(@AuthenticationPrincipal String userId,
                                          @PathVariable String id,
                                          @PathVariable String blockId,
                                          @RequestBody UpdateBlockRequest req) {
        return ResponseEntity.ok(siteService.updateBlock(userId, id, blockId, req));
    }

    @DeleteMapping("/sites/{id}/blocks/{blockId}")
    public ResponseEntity<?> deleteBlock(@AuthenticationPrincipal String userId,
                                          @PathVariable String id,
                                          @PathVariable String blockId) {
        siteService.deleteBlock(userId, id, blockId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sites/{id}/blocks/reorder")
    public ResponseEntity<?> reorderBlocks(@AuthenticationPrincipal String userId,
                                            @PathVariable String id,
                                            @RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        siteService.reorderBlocks(userId, id, ids);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping("/sites/{id}/form-submit")
    public ResponseEntity<?> formSubmit(@PathVariable String id,
                                         @RequestBody Map<String, Object> body,
                                         HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null) ip = ip.split(",")[0].trim();
        else ip = request.getRemoteAddr();
        siteService.submitForm(id, (String) body.get("blockId"),
                (String) body.get("formTitle"), body.get("data"), ip);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/sites/{id}/form-submissions")
    public ResponseEntity<?> getFormSubmissions(@AuthenticationPrincipal String userId,
                                                 @PathVariable String id) {
        return ResponseEntity.ok(siteService.getFormSubmissions(userId, id));
    }

    @GetMapping("/public/sites/{id}")
    public ResponseEntity<?> getPublicSite(@PathVariable String id) {
        return ResponseEntity.ok(siteService.getPublicSite(id));
    }
}
