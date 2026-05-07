package com.lilluucore.service;

import com.lilluucore.dto.CreateBlockRequest;
import com.lilluucore.dto.CreatePageRequest;
import com.lilluucore.dto.CreateSiteRequest;
import com.lilluucore.dto.UpdateBlockRequest;
import com.lilluucore.entity.Block;
import com.lilluucore.entity.Page;
import com.lilluucore.entity.Site;
import com.lilluucore.repository.BlockRepository;
import com.lilluucore.repository.FormSubmissionRepository;
import com.lilluucore.repository.PageRepository;
import com.lilluucore.repository.SiteRepository;
import com.lilluucore.entity.FormSubmission;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class SiteService {

    private final SiteRepository siteRepo;
    private final PageRepository pageRepo;
    private final BlockRepository blockRepo;
    private final FormSubmissionRepository formRepo;

    private static final Map<String, Map<String, Object>> BLOCK_DEFAULTS = new HashMap<>();
    private static final Map<String, List<String>> TEMPLATES = new HashMap<>();

    static {
        BLOCK_DEFAULTS.put("HERO", Map.of(
            "content", "{\"title\":\"Создайте что-то великое\",\"subtitle\":\"Профессиональный лендинг за минуты — без кода\",\"cta\":\"Начать бесплатно\",\"ctaUrl\":\"#\",\"ctaSecondary\":\"Узнать больше\",\"ctaSecondaryUrl\":\"#\",\"bgImage\":\"\"}",
            "styles", "{\"bg\":\"#0a0a1a\",\"textColor\":\"#ffffff\",\"ctaColor\":\"#7C3AED\",\"align\":\"center\",\"minHeight\":\"90vh\"}"
        ));
        BLOCK_DEFAULTS.put("FEATURES", Map.of(
            "content", "{\"title\":\"Почему выбирают нас\",\"subtitle\":\"Всё необходимое для успеха вашего бизнеса\",\"items\":[{\"icon\":\"Zap\",\"title\":\"Молниеносная скорость\",\"desc\":\"Страницы загружаются мгновенно.\"},{\"icon\":\"Shield\",\"title\":\"Надёжная безопасность\",\"desc\":\"SSL и ежедневное резервное копирование.\"},{\"icon\":\"Palette\",\"title\":\"Гибкий дизайн\",\"desc\":\"Сотни блоков и неограниченная кастомизация.\"}]}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\",\"columns\":3}"
        ));
        BLOCK_DEFAULTS.put("PRICING", Map.of(
            "content", "{\"title\":\"Простые тарифы\",\"subtitle\":\"Начните бесплатно\",\"plans\":[{\"name\":\"Free\",\"price\":\"$0\",\"period\":\"мес\",\"features\":[\"1 сайт\",\"5 блоков\"],\"cta\":\"Начать\",\"ctaUrl\":\"#\"},{\"name\":\"Pro\",\"price\":\"$19\",\"period\":\"мес\",\"features\":[\"10 сайтов\",\"∞ блоков\"],\"highlighted\":true,\"cta\":\"Попробовать\",\"ctaUrl\":\"#\"}]}",
            "styles", "{\"bg\":\"#0a0a14\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("TESTIMONIALS", Map.of(
            "content", "{\"title\":\"Что говорят клиенты\",\"items\":[{\"text\":\"Создал лендинг за 20 минут!\",\"author\":\"Иван Петров\",\"role\":\"CEO\"}]}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#cbd5e1\"}"
        ));
        BLOCK_DEFAULTS.put("CTA", Map.of(
            "content", "{\"title\":\"Готовы создать сайт мечты?\",\"subtitle\":\"Первый сайт — бесплатно.\",\"cta\":\"Начать бесплатно\",\"ctaUrl\":\"#\"}",
            "styles", "{\"bg\":\"linear-gradient(135deg, #7C3AED, #4F46E5)\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("FOOTER", Map.of(
            "content", "{\"company\":\"Моя Компания\",\"slogan\":\"Строим будущее вместе\",\"links\":[{\"label\":\"О нас\",\"url\":\"#\"}],\"copyright\":\"© 2025 Моя Компания.\"}",
            "styles", "{\"bg\":\"#050510\",\"textColor\":\"#475569\"}"
        ));
        BLOCK_DEFAULTS.put("STATS", Map.of(
            "content", "{\"title\":\"В цифрах\",\"items\":[{\"value\":\"10K+\",\"label\":\"Клиентов\"},{\"value\":\"99.9%\",\"label\":\"Uptime\"}]}",
            "styles", "{\"bg\":\"#0a0a1a\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("TEAM", Map.of(
            "content", "{\"title\":\"Наша команда\",\"members\":[{\"name\":\"Алексей Кузнецов\",\"role\":\"CEO\",\"avatar\":\"\"}]}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#ffffff\"}"
        ));
        BLOCK_DEFAULTS.put("FAQ", Map.of(
            "content", "{\"title\":\"FAQ\",\"items\":[{\"q\":\"Нужны знания кода?\",\"a\":\"Нет!\"}]}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("GALLERY", Map.of(
            "content", "{\"title\":\"Галерея\",\"images\":[]}",
            "styles", "{\"bg\":\"#0a0a14\",\"textColor\":\"#ffffff\",\"columns\":3}"
        ));
        BLOCK_DEFAULTS.put("CONTACTS", Map.of(
            "content", "{\"title\":\"Контакты\",\"email\":\"hello@company.com\"}",
            "styles", "{\"bg\":\"#0a0a14\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("HEADER_MENU", Map.of(
            "content", "{\"logo\":\"Компания\",\"links\":[{\"label\":\"Главная\",\"url\":\"#\",\"active\":true}],\"cta\":\"Связаться\",\"ctaUrl\":\"#\"}",
            "styles", "{\"bg\":\"#070711\",\"textColor\":\"#e2e8f0\",\"ctaColor\":\"#7C3AED\"}"
        ));
        BLOCK_DEFAULTS.put("PRODUCTS", Map.of(
            "content", "{\"title\":\"Каталог товаров\",\"items\":[{\"name\":\"Товар 1\",\"price\":\"1 200₽\",\"image\":\"\",\"badge\":\"Хит\"}]}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#ffffff\",\"columns\":3}"
        ));
        BLOCK_DEFAULTS.put("MUSIC_PLAYER", Map.of(
            "content", "{\"title\":\"Новый трек\",\"artist\":\"Исполнитель\",\"coverUrl\":\"\",\"trackUrl\":\"\"}",
            "styles", "{\"bg\":\"#0f172a\",\"textColor\":\"#f1f5f9\"}"
        ));
        BLOCK_DEFAULTS.put("DISCOGRAPHY", Map.of(
            "content", "{\"title\":\"Дискография\",\"albums\":[]}",
            "styles", "{\"bg\":\"#1e293b\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("FORM", Map.of(
            "content", "{\"title\":\"Оставьте заявку\",\"fields\":[{\"label\":\"Имя\",\"type\":\"text\",\"required\":true},{\"label\":\"Email\",\"type\":\"email\",\"required\":true}],\"ctaLabel\":\"Отправить\"}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\",\"ctaColor\":\"#7C3AED\"}"
        ));
        BLOCK_DEFAULTS.put("BLOG", Map.of(
            "content", "{\"title\":\"Блог\",\"items\":[]}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("TEXT", Map.of(
            "content", "{\"title\":\"Заголовок блока\",\"body\":\"Здесь будет ваш текст.\"}",
            "styles", "{\"bg\":\"#0f0f23\",\"textColor\":\"#e2e8f0\",\"align\":\"left\"}"
        ));
        BLOCK_DEFAULTS.put("SCHEDULE", Map.of(
            "content", "{\"title\":\"Расписание\",\"items\":[]}",
            "styles", "{\"bg\":\"#1e293b\",\"textColor\":\"#e2e8f0\"}"
        ));
        BLOCK_DEFAULTS.put("COACHES", Map.of(
            "content", "{\"title\":\"Наши тренеры\",\"members\":[]}",
            "styles", "{\"bg\":\"#1a1a2e\",\"textColor\":\"#ffffff\"}"
        ));

        TEMPLATES.put("LANDING", List.of("HEADER_MENU","HERO","FEATURES","STATS","TESTIMONIALS","FAQ","CTA","FOOTER"));
        TEMPLATES.put("ECOMMERCE", List.of("HEADER_MENU","HERO","PRODUCTS","FEATURES","STATS","TESTIMONIALS","FAQ","FOOTER"));
        TEMPLATES.put("MUSIC_LABEL", List.of("HEADER_MENU","HERO","MUSIC_PLAYER","DISCOGRAPHY","TEAM","GALLERY","CONTACTS","FOOTER"));
        TEMPLATES.put("FITNESS", List.of("HEADER_MENU","HERO","STATS","FEATURES","SCHEDULE","COACHES","PRICING","TESTIMONIALS","FAQ","FOOTER"));
    }

    public SiteService(SiteRepository siteRepo, PageRepository pageRepo,
                       BlockRepository blockRepo, FormSubmissionRepository formRepo) {
        this.siteRepo = siteRepo;
        this.pageRepo = pageRepo;
        this.blockRepo = blockRepo;
        this.formRepo = formRepo;
    }

    public List<Map<String, Object>> getSitesForUser(String userId) {
        List<Site> sites = siteRepo.findByUserIdOrderByCreatedAtDesc(userId);
        return sites.stream().map(site -> {
            Map<String, Object> result = siteToMap(site);
            result.put("blocks", blockRepo.findBySiteIdOrderByPositionAsc(site.getId()));
            result.put("pages", pageRepo.findBySiteIdOrderByPositionAsc(site.getId()));
            return result;
        }).toList();
    }

    @Transactional
    public Map<String, Object> createSite(String userId, CreateSiteRequest req) {
        String id = generateId();
        String sub = (req.getSubdomain() != null && !req.getSubdomain().isBlank()
                ? req.getSubdomain()
                : req.getName().toLowerCase().replaceAll("\\s+", "-").replaceAll("[^a-z0-9-]", ""))
                + ".lilluucore.com";

        Site site = new Site();
        site.setId(id);
        site.setUserId(userId);
        site.setName(req.getName());
        site.setSubdomain(sub);
        site.setBusinessType(req.getBusinessType());
        site.setStatus("DRAFT");
        site.setGlobalStyles("{\"fontFamily\":\"Inter\",\"primaryColor\":\"#7C3AED\"}");
        siteRepo.save(site);

        String pageId = generateId();
        Page page = new Page();
        page.setId(pageId);
        page.setSiteId(id);
        page.setName("Главная");
        page.setSlug("index");
        page.setPosition(0);
        pageRepo.save(page);

        List<String> template = TEMPLATES.getOrDefault(req.getBusinessType(), TEMPLATES.get("LANDING"));
        List<Block> blocks = new ArrayList<>();
        for (int i = 0; i < template.size(); i++) {
            String type = template.get(i);
            Map<String, Object> def = BLOCK_DEFAULTS.getOrDefault(type, Map.of("content", "{}", "styles", "{}"));
            Block block = new Block();
            block.setId(generateId());
            block.setSiteId(id);
            block.setPageId(pageId);
            block.setType(type);
            block.setPosition(i);
            block.setContent((String) def.get("content"));
            block.setStyles((String) def.get("styles"));
            block.setVisible(true);
            block.setWidth(100);
            blocks.add(block);
        }
        blockRepo.saveAll(blocks);

        Site saved = siteRepo.findById(id).orElseThrow();
        Map<String, Object> result = siteToMap(saved);
        result.put("blocks", blockRepo.findBySiteIdOrderByPositionAsc(id));
        result.put("pages", pageRepo.findBySiteIdOrderByPositionAsc(id));
        return result;
    }

    public Map<String, Object> getSite(String userId, String siteId) {
        Site site = siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        Map<String, Object> result = siteToMap(site);
        result.put("blocks", blockRepo.findBySiteIdOrderByPositionAsc(siteId));
        result.put("pages", pageRepo.findBySiteIdOrderByPositionAsc(siteId));
        return result;
    }

    @Transactional
    public void deleteSite(String userId, String siteId) {
        Site site = siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        siteRepo.delete(site);
    }

    @Transactional
    public Map<String, Object> publishSite(String userId, String siteId) {
        Site site = siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        String publishedUrl = "https://" + site.getSubdomain();
        site.setStatus("PUBLISHED");
        site.setPublishedUrl(publishedUrl);
        site.setUpdatedAt(LocalDateTime.now());
        siteRepo.save(site);
        return Map.of("url", publishedUrl, "site", siteToMap(site));
    }

    @Transactional
    public void updateStyles(String userId, String siteId, String styles) {
        Site site = siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        site.setGlobalStyles(styles != null ? styles : "{}");
        site.setUpdatedAt(LocalDateTime.now());
        siteRepo.save(site);
    }

    public List<Page> getPages(String userId, String siteId) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        return pageRepo.findBySiteIdOrderByPositionAsc(siteId);
    }

    @Transactional
    public Page createPage(String userId, String siteId, CreatePageRequest req) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        long count = pageRepo.countBySiteId(siteId);
        String cleanSlug = (req.getSlug() != null && !req.getSlug().isBlank() ? req.getSlug() : req.getName() != null ? req.getName() : "page")
                .toLowerCase().replaceAll("\\s+", "-").replaceAll("[^a-z0-9-]", "");
        Page page = new Page();
        page.setId(generateId());
        page.setSiteId(siteId);
        page.setName(req.getName() != null ? req.getName() : "Новая страница");
        page.setSlug(cleanSlug);
        page.setPosition((int) count);
        return pageRepo.save(page);
    }

    @Transactional
    public Page updatePage(String userId, String siteId, String pageId, Map<String, Object> body) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        Page page = pageRepo.findByIdAndSiteId(pageId, siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found"));
        if (body.containsKey("name")) page.setName((String) body.get("name"));
        if (body.containsKey("slug")) page.setSlug(((String) body.get("slug")).toLowerCase().replaceAll("[^a-z0-9-]", ""));
        if (body.containsKey("meta")) page.setMeta((String) body.get("meta"));
        return pageRepo.save(page);
    }

    @Transactional
    public void deletePage(String userId, String siteId, String pageId) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        if (pageRepo.countBySiteId(siteId) <= 1)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Нельзя удалить последнюю страницу");
        Page page = pageRepo.findByIdAndSiteId(pageId, siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Page not found"));
        blockRepo.deleteByPageId(pageId);
        pageRepo.delete(page);
    }

    @Transactional
    public Block createBlock(String userId, String siteId, CreateBlockRequest req) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        Map<String, Object> def = BLOCK_DEFAULTS.getOrDefault(req.getType(), Map.of("content", "{}", "styles", "{}"));
        Block block = new Block();
        block.setId(generateId());
        block.setSiteId(siteId);
        block.setPageId(req.getPageId());
        block.setType(req.getType());
        block.setPosition(req.getPosition() != null ? req.getPosition() : 0);
        block.setWidth(req.getWidth() != null ? req.getWidth() : 100);
        block.setRowId(req.getRowId());
        block.setContent(req.getContent() != null ? req.getContent() : (String) def.get("content"));
        block.setStyles(req.getStyles() != null ? req.getStyles() : (String) def.get("styles"));
        block.setVisible(true);
        return blockRepo.save(block);
    }

    @Transactional
    public Block updateBlock(String userId, String siteId, String blockId, UpdateBlockRequest req) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        Block block = blockRepo.findByIdAndSiteId(blockId, siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        if (req.getContent() != null) block.setContent(req.getContent());
        if (req.getStyles() != null) block.setStyles(req.getStyles());
        if (req.getVisible() != null) block.setVisible(req.getVisible());
        if (req.getWidth() != null) block.setWidth(req.getWidth());
        if (req.getRowId() != null) block.setRowId(req.getRowId());
        if (req.getPageId() != null) block.setPageId(req.getPageId());
        if (req.getPosition() != null) block.setPosition(req.getPosition());
        return blockRepo.save(block);
    }

    @Transactional
    public void deleteBlock(String userId, String siteId, String blockId) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        Block block = blockRepo.findByIdAndSiteId(blockId, siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Block not found"));
        blockRepo.delete(block);
    }

    @Transactional
    public void reorderBlocks(String userId, String siteId, List<String> ids) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        List<Block> siteBlocks = blockRepo.findBySiteIdOrderByPositionAsc(siteId);
        Set<String> ownedIds = new HashSet<>();
        for (Block b : siteBlocks) ownedIds.add(b.getId());
        for (int i = 0; i < ids.size(); i++) {
            String id = ids.get(i);
            if (!ownedIds.contains(id)) continue;
            final int pos = i;
            siteBlocks.stream().filter(b -> b.getId().equals(id)).findFirst().ifPresent(b -> {
                b.setPosition(pos);
                blockRepo.save(b);
            });
        }
    }

    @Transactional
    public void submitForm(String siteId, String blockId, String formTitle, Object data, String ip) {
        FormSubmission fs = new FormSubmission();
        fs.setSiteId(siteId);
        fs.setBlockId(blockId);
        fs.setFormTitle(formTitle != null ? formTitle : "Заявка");
        fs.setData(data instanceof String ? (String) data : data.toString());
        fs.setSubmitterIp(ip);
        formRepo.save(fs);
    }

    public List<FormSubmission> getFormSubmissions(String userId, String siteId) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Not found"));
        return formRepo.findBySiteIdOrderByCreatedAtDesc(siteId);
    }

    public Map<String, Object> getPublicSite(String siteId) {
        Site site = siteRepo.findById(siteId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        if (site.isFrozen())
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    site.getFrozenReason() != null ? site.getFrozenReason() : "Нарушение пользовательского соглашения");
        if (!"PUBLISHED".equals(site.getStatus()))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "draft");
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("site", Map.of(
                "id", site.getId(), "name", site.getName(),
                "subdomain", site.getSubdomain(), "businessType", site.getBusinessType(),
                "globalStyles", site.getGlobalStyles()
        ));
        result.put("blocks", blockRepo.findBySiteIdOrderByPositionAsc(siteId));
        result.put("pages", pageRepo.findBySiteIdOrderByPositionAsc(siteId));
        return result;
    }

    public Map<String, Object> getStats(String userId, String siteId, String period) {
        siteRepo.findByIdAndUserId(siteId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Site not found"));
        return buildStats(period);
    }

    public Map<String, Object> getAllStats(String userId, String period) {
        return buildStats(period);
    }

    private Map<String, Object> buildStats(String period) {
        int days = "30d".equals(period) ? 30 : "90d".equals(period) ? 90 : 7;
        List<Map<String, Object>> chart = new ArrayList<>();
        int totalViews = 0, totalClicks = 0, totalVisitors = 0;
        Random rng = new Random();
        for (int i = 0; i < days; i++) {
            int views = rng.nextInt(500) + 50;
            int clicks = (int) (views * 0.3);
            int visitors = (int) (views * 0.7);
            totalViews += views; totalClicks += clicks; totalVisitors += visitors;
            chart.add(Map.of("views", views, "clicks", clicks, "visitors", visitors));
        }
        return Map.of(
                "views", totalViews, "uniqueVisitors", totalVisitors,
                "clicks", totalClicks, "avgSessionSec", 142, "bounceRate", 38,
                "period", days + "d", "dbUsedMb", 18, "dbTotalMb", 512,
                "chartData", chart
        );
    }

    private Map<String, Object> siteToMap(Site site) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", site.getId());
        m.put("userId", site.getUserId());
        m.put("name", site.getName());
        m.put("subdomain", site.getSubdomain());
        m.put("businessType", site.getBusinessType());
        m.put("status", site.getStatus());
        m.put("publishedUrl", site.getPublishedUrl());
        m.put("globalStyles", site.getGlobalStyles());
        m.put("frozen", site.isFrozen());
        m.put("frozenReason", site.getFrozenReason());
        m.put("frozenBy", site.getFrozenBy());
        m.put("frozenAt", site.getFrozenAt());
        m.put("createdAt", site.getCreatedAt());
        m.put("updatedAt", site.getUpdatedAt());
        return m;
    }

    private String generateId() {
        return Long.toString(System.currentTimeMillis(), 36) + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    }
}
