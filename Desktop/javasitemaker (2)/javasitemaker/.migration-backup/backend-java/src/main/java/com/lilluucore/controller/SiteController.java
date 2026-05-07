package com.lilluucore.controller;

import com.lilluucore.entity.*;
import com.lilluucore.repository.*;
import com.lilluucore.service.SiteTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class SiteController {

    private final SiteRepository siteRepo;
    private final PageRepository pageRepo;
    private final BlockRepository blockRepo;
    private final FormSubmissionRepository formRepo;
    private final SiteTemplateService templateService;

    public SiteController(SiteRepository siteRepo, PageRepository pageRepo,
                          BlockRepository blockRepo, FormSubmissionRepository formRepo,
                          SiteTemplateService templateService) {
        this.siteRepo = siteRepo;
        this.pageRepo = pageRepo;
        this.blockRepo = blockRepo;
        this.formRepo = formRepo;
        this.templateService = templateService;
    }

    private String generateId() {
        return Long.toString(Math.abs(new Random().nextLong()), 36) + Long.toString(System.currentTimeMillis(), 36);
    }

    private Map<String, Object> makeStats(int days) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd.MM").withZone(ZoneId.systemDefault());
        long now = System.currentTimeMillis();
        List<Map<String, Object>> chart = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            long ts = now - (long)(days - 1 - i) * 86400000;
            String label = fmt.format(Instant.ofEpochMilli(ts));
            int views = (int)(Math.random() * 500) + 50;
            int visitors = (int)(views * 0.7);
            Map<String, Object> pt = new LinkedHashMap<>();
            pt.put("date", label);
            pt.put("views", views);
            pt.put("clicks", (int)(views * 0.3));
            pt.put("visitors", visitors);
            pt.put("newRegistrations", (int)(Math.random() * 20));
            pt.put("avgSessionSec", (int)(Math.random() * 180) + 60);
            chart.add(pt);
        }
        int totalViews = chart.stream().mapToInt(d -> (int)d.get("views")).sum();
        int totalVisitors = chart.stream().mapToInt(d -> (int)d.get("visitors")).sum();
        int totalClicks = chart.stream().mapToInt(d -> (int)d.get("clicks")).sum();
        int totalNewReg = chart.stream().mapToInt(d -> (int)d.get("newRegistrations")).sum();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("views", totalViews);
        result.put("uniqueVisitors", totalVisitors);
        result.put("clicks", totalClicks);
        result.put("newRegistrations", totalNewReg);
        result.put("avgSessionSec", 142);
        result.put("bounceRate", 38);
        result.put("period", days + "d");
        result.put("dbUsedMb", 18);
        result.put("dbTotalMb", 512);
        result.put("chartData", chart);
        return result;
    }

    private Map<String, Object> siteWithData(Site site) {
        List<Block> blocks = blockRepo.findBySiteIdOrderByPositionAsc(site.getId());
        List<Page> pages = pageRepo.findBySiteIdOrderByPositionAsc(site.getId());
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", site.getId());
        map.put("userId", site.getUserId());
        map.put("name", site.getName());
        map.put("subdomain", site.getSubdomain());
        map.put("businessType", site.getBusinessType());
        map.put("status", site.getStatus());
        map.put("publishedUrl", site.getPublishedUrl());
        map.put("globalStyles", site.getGlobalStyles());
        map.put("frozen", site.isFrozen());
        map.put("frozenReason", site.getFrozenReason());
        map.put("frozenBy", site.getFrozenBy());
        map.put("frozenAt", site.getFrozenAt());
        map.put("createdAt", site.getCreatedAt());
        map.put("updatedAt", site.getUpdatedAt());
        map.put("blocks", blocks);
        map.put("pages", pages);
        return map;
    }

    // ─── Sites ─────────────────────────────────────────────────────

    @GetMapping("/sites")
    public ResponseEntity<?> listSites(@AuthenticationPrincipal String userId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        List<Site> sites = siteRepo.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(sites.stream().map(this::siteWithData).toList());
    }

    @GetMapping("/sites/stats/all")
    public ResponseEntity<?> allStats(@AuthenticationPrincipal String userId,
                                      @RequestParam(defaultValue = "7d") String period) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        int days = "30d".equals(period) ? 30 : "90d".equals(period) ? 90 : 7;
        return ResponseEntity.ok(makeStats(days));
    }

    @PostMapping("/sites")
    @Transactional
    public ResponseEntity<?> createSite(@AuthenticationPrincipal String userId,
                                        @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String name = (String) body.get("name");
        String businessType = (String) body.get("businessType");
        if (name == null || businessType == null)
            return ResponseEntity.badRequest().body(Map.of("message", "name и businessType обязательны"));

        String siteId = generateId();
        String rawSub = (String) body.getOrDefault("subdomain", name.toLowerCase()
            .replaceAll("\\s+", "-").replaceAll("[^a-z0-9-]", ""));
        String subdomain = rawSub + ".lilluucore.com";

        Site site = new Site();
        site.setId(siteId);
        site.setUserId(userId);
        site.setName(name);
        site.setSubdomain(subdomain);
        site.setBusinessType(businessType);
        site.setStatus("DRAFT");
        site.setGlobalStyles("{\"fontFamily\":\"Inter\",\"primaryColor\":\"#7C3AED\"}");
        siteRepo.save(site);

        String pageId = generateId();
        Page page = new Page();
        page.setId(pageId);
        page.setSiteId(siteId);
        page.setName("Главная");
        page.setSlug("index");
        page.setPosition(0);
        pageRepo.save(page);

        List<String> template = templateService.getTemplate(businessType);
        List<Block> blocks = new ArrayList<>();
        for (int i = 0; i < template.size(); i++) {
            String type = template.get(i);
            Block block = new Block();
            block.setId(generateId());
            block.setSiteId(siteId);
            block.setPageId(pageId);
            block.setType(type);
            block.setPosition(i);
            block.setContent(templateService.resolveContent(businessType, type));
            block.setStyles(templateService.resolveStyles(businessType, type));
            block.setVisible(true);
            block.setWidth(100);
            blocks.add(block);
        }
        if (!blocks.isEmpty()) blockRepo.saveAll(blocks);

        return ResponseEntity.status(201).body(siteWithData(siteRepo.findById(siteId).orElseThrow()));
    }

    @GetMapping("/sites/{id}")
    public ResponseEntity<?> getSite(@AuthenticationPrincipal String userId,
                                     @PathVariable String id) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        return siteRepo.findByIdAndUserId(id, userId)
            .map(site -> ResponseEntity.ok(siteWithData(site)))
            .orElse(ResponseEntity.status(404).body(Map.of("message", "Site not found")));
    }

    @GetMapping("/sites/{id}/stats")
    public ResponseEntity<?> siteStats(@AuthenticationPrincipal String userId,
                                       @PathVariable String id,
                                       @RequestParam(defaultValue = "7d") String period) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        if (siteRepo.findByIdAndUserId(id, userId).isEmpty())
            return ResponseEntity.status(404).body(Map.of("message", "Site not found"));
        int days = "30d".equals(period) ? 30 : "90d".equals(period) ? 90 : 7;
        return ResponseEntity.ok(makeStats(days));
    }

    @DeleteMapping("/sites/{id}")
    public ResponseEntity<?> deleteSite(@AuthenticationPrincipal String userId,
                                        @PathVariable String id) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        siteRepo.findByIdAndUserId(id, userId).ifPresent(siteRepo::delete);
        return ResponseEntity.status(204).build();
    }

    @PostMapping("/sites/{id}/publish")
    public ResponseEntity<?> publishSite(@AuthenticationPrincipal String userId,
                                         @PathVariable String id) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<Site> opt = siteRepo.findByIdAndUserId(id, userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Site not found"));
        Site site = opt.get();
        String publishedUrl = "https://" + site.getSubdomain();
        site.setStatus("PUBLISHED");
        site.setPublishedUrl(publishedUrl);
        site.setUpdatedAt(Instant.now());
        siteRepo.save(site);
        return ResponseEntity.ok(Map.of("url", publishedUrl, "site", siteWithData(site)));
    }

    @PutMapping("/sites/{id}/styles")
    public ResponseEntity<?> updateStyles(@AuthenticationPrincipal String userId,
                                          @PathVariable String id,
                                          @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        siteRepo.findByIdAndUserId(id, userId).ifPresent(site -> {
            Object styles = body.get("styles");
            site.setGlobalStyles(styles != null ? styles.toString() : "{}");
            site.setUpdatedAt(Instant.now());
            siteRepo.save(site);
        });
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ─── Pages ─────────────────────────────────────────────────────

    @GetMapping("/sites/{id}/pages")
    public ResponseEntity<?> listPages(@AuthenticationPrincipal String userId,
                                       @PathVariable String id) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        if (siteRepo.findByIdAndUserId(id, userId).isEmpty())
            return ResponseEntity.status(404).body(Map.of("message", "Site not found"));
        return ResponseEntity.ok(pageRepo.findBySiteIdOrderByPositionAsc(id));
    }

    @PostMapping("/sites/{id}/pages")
    public ResponseEntity<?> createPage(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<Site> opt = siteRepo.findByIdAndUserId(id, userId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Site not found"));

        String name = (String) body.getOrDefault("name", "Новая страница");
        String slug = (String) body.getOrDefault("slug", name);
        String cleanSlug = slug.toLowerCase().replaceAll("\\s+", "-").replaceAll("[^a-z0-9-]", "");
        long position = pageRepo.countBySiteId(id);

        Page page = new Page();
        page.setId(generateId());
        page.setSiteId(id);
        page.setName(name);
        page.setSlug(cleanSlug);
        page.setPosition((int) position);
        return ResponseEntity.status(201).body(pageRepo.save(page));
    }

    @PutMapping("/sites/{id}/pages/{pageId}")
    public ResponseEntity<?> updatePage(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @PathVariable String pageId,
                                        @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<Page> opt = pageRepo.findById(pageId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Page not found"));
        Page page = opt.get();
        if (body.containsKey("name")) page.setName((String) body.get("name"));
        if (body.containsKey("slug")) {
            String s = (String) body.get("slug");
            page.setSlug(s.toLowerCase().replaceAll("\\s+", "-").replaceAll("[^a-z0-9-]", ""));
        }
        if (body.containsKey("meta")) page.setMeta(body.get("meta").toString());
        return ResponseEntity.ok(pageRepo.save(page));
    }

    @DeleteMapping("/sites/{id}/pages/{pageId}")
    @Transactional
    public ResponseEntity<?> deletePage(@AuthenticationPrincipal String userId,
                                        @PathVariable String id,
                                        @PathVariable String pageId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        if (pageRepo.countBySiteId(id) <= 1)
            return ResponseEntity.badRequest().body(Map.of("message", "Нельзя удалить последнюю страницу"));
        blockRepo.deleteByPageId(pageId);
        pageRepo.deleteById(pageId);
        return ResponseEntity.status(204).build();
    }

    // ─── Blocks ─────────────────────────────────────────────────────

    @PostMapping("/sites/{id}/blocks")
    public ResponseEntity<?> createBlock(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        if (siteRepo.findByIdAndUserId(id, userId).isEmpty())
            return ResponseEntity.status(404).body(Map.of("message", "Site not found"));

        String type = (String) body.get("type");
        SiteTemplateService.BlockDefault def = templateService.getDefault(type);

        Block block = new Block();
        block.setId(generateId());
        block.setSiteId(id);
        block.setPageId((String) body.get("pageId"));
        block.setType(type);
        block.setPosition(body.get("position") != null ? ((Number) body.get("position")).intValue() : 0);
        block.setRowId((String) body.get("rowId"));
        block.setContent(def.content());
        block.setStyles(def.styles());
        block.setVisible(true);
        block.setWidth(body.get("width") != null ? ((Number) body.get("width")).intValue() : 100);
        return ResponseEntity.status(201).body(blockRepo.save(block));
    }

    @PutMapping("/sites/{id}/blocks/{blockId}")
    public ResponseEntity<?> updateBlock(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @PathVariable String blockId,
                                         @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        Optional<Block> opt = blockRepo.findById(blockId);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Block not found"));
        Block block = opt.get();
        if (body.containsKey("content")) block.setContent(body.get("content").toString());
        if (body.containsKey("styles")) block.setStyles(body.get("styles").toString());
        if (body.containsKey("visible")) block.setVisible(Boolean.TRUE.equals(body.get("visible")));
        if (body.containsKey("width")) block.setWidth(((Number) body.get("width")).intValue());
        if (body.containsKey("rowId")) block.setRowId((String) body.get("rowId"));
        if (body.containsKey("pageId")) block.setPageId((String) body.get("pageId"));
        if (body.containsKey("position")) block.setPosition(((Number) body.get("position")).intValue());
        return ResponseEntity.ok(blockRepo.save(block));
    }

    @DeleteMapping("/sites/{id}/blocks/{blockId}")
    public ResponseEntity<?> deleteBlock(@AuthenticationPrincipal String userId,
                                         @PathVariable String id,
                                         @PathVariable String blockId) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        blockRepo.deleteById(blockId);
        return ResponseEntity.status(204).build();
    }

    @PutMapping("/sites/{id}/blocks/reorder")
    @Transactional
    public ResponseEntity<?> reorderBlocks(@AuthenticationPrincipal String userId,
                                           @PathVariable String id,
                                           @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null) return ResponseEntity.badRequest().body(Map.of("message", "ids required"));
        for (int i = 0; i < ids.size(); i++) {
            final int pos = i;
            blockRepo.findById(ids.get(i)).ifPresent(block -> {
                block.setPosition(pos);
                blockRepo.save(block);
            });
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    // ─── Form submissions ───────────────────────────────────────────

    @PostMapping("/sites/{id}/form-submit")
    public ResponseEntity<?> formSubmit(@PathVariable String id,
                                        @RequestBody Map<String, Object> body,
                                        jakarta.servlet.http.HttpServletRequest request) {
        String blockId = (String) body.get("blockId");
        String formTitle = (String) body.getOrDefault("formTitle", "Заявка");
        Object data = body.get("data");
        String dataStr = data instanceof String ? (String) data : (data != null ? data.toString() : "{}");

        String xForward = request.getHeader("X-Forwarded-For");
        String ip = xForward != null ? xForward.split(",")[0].trim() : request.getRemoteAddr();

        FormSubmission fs = new FormSubmission();
        fs.setSiteId(id);
        fs.setBlockId(blockId);
        fs.setFormTitle(formTitle);
        fs.setData(dataStr);
        fs.setSubmitterIp(ip);
        formRepo.save(fs);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @GetMapping("/sites/{id}/form-submissions")
    public ResponseEntity<?> formSubmissions(@AuthenticationPrincipal String userId,
                                             @PathVariable String id) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        if (siteRepo.findByIdAndUserId(id, userId).isEmpty())
            return ResponseEntity.status(404).body(Map.of("message", "Not found"));
        return ResponseEntity.ok(formRepo.findBySiteIdOrderByCreatedAtDesc(id));
    }

    // ─── Public preview ─────────────────────────────────────────────

    @GetMapping("/public/sites/{id}")
    public ResponseEntity<?> publicSite(@PathVariable String id) {
        Optional<Site> opt = siteRepo.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("message", "Site not found"));
        Site site = opt.get();
        if (site.isFrozen())
            return ResponseEntity.status(403).body(Map.of("message", "frozen",
                "frozenReason", site.getFrozenReason() != null ? site.getFrozenReason() : "Нарушение пользовательского соглашения"));
        if (!"PUBLISHED".equals(site.getStatus()))
            return ResponseEntity.status(404).body(Map.of("message", "draft"));

        List<Block> blocks = blockRepo.findBySiteIdOrderByPositionAsc(site.getId());
        List<Page> pages = pageRepo.findBySiteIdOrderByPositionAsc(site.getId());
        return ResponseEntity.ok(Map.of(
            "site", Map.of("id", site.getId(), "name", site.getName(),
                "subdomain", site.getSubdomain(), "businessType", site.getBusinessType(),
                "globalStyles", site.getGlobalStyles()),
            "blocks", blocks, "pages", pages
        ));
    }
}
