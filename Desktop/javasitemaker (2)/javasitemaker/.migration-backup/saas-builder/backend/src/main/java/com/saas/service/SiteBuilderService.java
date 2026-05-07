package com.saas.service;

import com.saas.dto.*;
import com.saas.entity.Block;
import com.saas.entity.Site;
import com.saas.entity.Tenant;
import com.saas.repository.BlockRepository;
import com.saas.repository.SiteRepository;
import com.saas.repository.TenantRepository;
import com.saas.repository.UserRepository;
import com.saas.websocket.SiteEventPublisher;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SiteBuilderService {

    private final SiteRepository siteRepository;
    private final TenantRepository tenantRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final SiteEventPublisher siteEventPublisher;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String DRAFT_KEY_PREFIX = "draft:site:";

    @Transactional
    public SiteResponse createSite(CreateSiteRequest request, String userEmail) {
        Tenant tenant = tenantRepository.findById(request.getTenantId())
                .orElseThrow(() -> new RuntimeException("Tenant not found: " + request.getTenantId()));

        if (!tenant.getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("Access denied: tenant does not belong to user");
        }

        String subdomain = generateSubdomain(request.getName());

        Site site = Site.builder()
                .name(request.getName())
                .businessType(request.getBusinessType())
                .subdomain(subdomain)
                .tenant(tenant)
                .status(Site.SiteStatus.DRAFT)
                .globalStyles(getDefaultStyles(request.getBusinessType()))
                .seoMeta(getDefaultSeoMeta(request.getName()))
                .build();

        site = siteRepository.save(site);

        List<Block> defaultBlocks = createDefaultBlocks(site, request.getBusinessType());
        blockRepository.saveAll(defaultBlocks);
        site.setBlocks(defaultBlocks);

        log.info("Site created: {} with {} default blocks", site.getId(), defaultBlocks.size());

        SiteResponse response = SiteResponse.from(site);
        response.setBlocks(defaultBlocks.stream().map(BlockResponse::from).toList());
        return response;
    }

    @Cacheable(value = "sites", key = "#siteId")
    public SiteResponse getSite(UUID siteId, String userEmail) {
        Site site = getSiteWithOwnerCheck(siteId, userEmail);
        List<Block> blocks = blockRepository.findBySiteOrderByPositionAsc(site);
        SiteResponse response = SiteResponse.from(site);
        response.setBlocks(blocks.stream().map(BlockResponse::from).toList());
        return response;
    }

    public Page<SiteResponse> getSitesForUser(String userEmail, Pageable pageable) {
        UUID userId = getUserId(userEmail);
        return siteRepository.findByOwnerUserId(userId, pageable)
                .map(site -> {
                    SiteResponse r = SiteResponse.from(site);
                    r.setBlocks(new ArrayList<>());
                    return r;
                });
    }

    public List<SiteResponse> getAllSitesForUser(String userEmail) {
        UUID userId = getUserId(userEmail);
        return siteRepository.findByOwnerUserId(userId)
                .stream()
                .map(site -> {
                    SiteResponse r = SiteResponse.from(site);
                    r.setBlocks(new ArrayList<>());
                    return r;
                })
                .toList();
    }

    @Transactional
    @CacheEvict(value = "sites", key = "#siteId")
    public SiteResponse updateSite(UUID siteId, UpdateSiteRequest request, String userEmail) {
        Site site = getSiteWithOwnerCheck(siteId, userEmail);

        if (request.getName() != null) site.setName(request.getName());
        if (request.getGlobalStyles() != null) site.setGlobalStyles(request.getGlobalStyles());
        if (request.getSeoMeta() != null) site.setSeoMeta(request.getSeoMeta());

        site = siteRepository.save(site);
        siteEventPublisher.publishStyleUpdate(siteId, site.getGlobalStyles());

        SiteResponse response = SiteResponse.from(site);
        response.setBlocks(blockRepository.findBySiteOrderByPositionAsc(site)
                .stream().map(BlockResponse::from).toList());
        return response;
    }

    @Transactional
    @CacheEvict(value = "sites", key = "#siteId")
    public void deleteSite(UUID siteId, String userEmail) {
        Site site = getSiteWithOwnerCheck(siteId, userEmail);
        blockRepository.deleteBySiteId(siteId);
        siteRepository.delete(site);
        redisTemplate.delete(DRAFT_KEY_PREFIX + siteId);
        log.info("Site {} deleted", siteId);
    }

    @Transactional
    public BlockResponse addBlock(UUID siteId, CreateBlockRequest request, String userEmail) {
        Site site = getSiteWithOwnerCheck(siteId, userEmail);

        List<Block> existingBlocks = blockRepository.findBySiteOrderByPositionAsc(site);
        for (Block b : existingBlocks) {
            if (b.getPosition() >= request.getPosition()) {
                b.setPosition(b.getPosition() + 1);
            }
        }
        blockRepository.saveAll(existingBlocks);

        Block block = Block.builder()
                .type(request.getType())
                .position(request.getPosition())
                .content(request.getContent() != null ? request.getContent() : "{}")
                .styles(request.getStyles() != null ? request.getStyles() : "{}")
                .site(site)
                .build();

        block = blockRepository.save(block);
        saveDraft(siteId);
        siteEventPublisher.publishBlockAdded(siteId, BlockResponse.from(block));

        return BlockResponse.from(block);
    }

    @Transactional
    @CacheEvict(value = "blocks", key = "#blockId")
    public BlockResponse updateBlock(UUID blockId, UpdateBlockRequest request, String userEmail) {
        Block block = blockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Block not found: " + blockId));

        validateSiteOwnership(block.getSite(), userEmail);

        if (request.getContent() != null) block.setContent(request.getContent());
        if (request.getStyles() != null) block.setStyles(request.getStyles());
        if (request.getPosition() != null) block.setPosition(request.getPosition());
        if (request.getVisible() != null) block.setVisible(request.getVisible());

        block = blockRepository.save(block);
        BlockResponse response = BlockResponse.from(block);

        saveDraft(block.getSite().getId());
        siteEventPublisher.publishBlockUpdated(block.getSite().getId(), response);

        return response;
    }

    @Transactional
    public void deleteBlock(UUID blockId, String userEmail) {
        Block block = blockRepository.findById(blockId)
                .orElseThrow(() -> new RuntimeException("Block not found: " + blockId));

        validateSiteOwnership(block.getSite(), userEmail);
        UUID siteId = block.getSite().getId();

        blockRepository.delete(block);

        List<Block> remaining = blockRepository.findBySiteOrderByPositionAsc(block.getSite());
        for (int i = 0; i < remaining.size(); i++) {
            remaining.get(i).setPosition(i);
        }
        blockRepository.saveAll(remaining);

        siteEventPublisher.publishBlockDeleted(siteId, blockId);
    }

    @Transactional
    public List<BlockResponse> reorderBlocks(UUID siteId, ReorderBlocksRequest request, String userEmail) {
        Site site = getSiteWithOwnerCheck(siteId, userEmail);
        List<Block> blocks = blockRepository.findBySiteOrderByPositionAsc(site);

        for (int i = 0; i < request.getBlockIds().size(); i++) {
            final int position = i;
            final UUID blockId = request.getBlockIds().get(i);
            blocks.stream()
                    .filter(b -> b.getId().equals(blockId))
                    .findFirst()
                    .ifPresent(b -> b.setPosition(position));
        }

        blocks = blockRepository.saveAll(blocks);
        List<BlockResponse> responses = blocks.stream().map(BlockResponse::from).toList();
        siteEventPublisher.publishBlocksReordered(siteId, responses);
        return responses;
    }

    public Map<String, Object> getDashboardStats(String userEmail) {
        UUID userId = getUserId(userEmail);
        long totalSites = siteRepository.countByOwnerUserId(userId);
        long publishedSites = siteRepository.countPublishedByOwnerUserId(userId);
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<Site> recentActivity = siteRepository.findRecentActivity(userId, since);

        return Map.of(
                "totalSites", totalSites,
                "publishedSites", publishedSites,
                "draftSites", totalSites - publishedSites,
                "recentActivity", recentActivity.size()
        );
    }

    private void saveDraft(UUID siteId) {
        try {
            redisTemplate.opsForValue().set(
                    DRAFT_KEY_PREFIX + siteId,
                    "draft-" + System.currentTimeMillis(),
                    Duration.ofHours(24)
            );
        } catch (Exception e) {
            log.warn("Failed to save draft to Redis: {}", e.getMessage());
        }
    }

    private Site getSiteWithOwnerCheck(UUID siteId, String userEmail) {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found: " + siteId));
        validateSiteOwnership(site, userEmail);
        return site;
    }

    private void validateSiteOwnership(Site site, String userEmail) {
        if (!site.getTenant().getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("Access denied: site does not belong to user");
        }
    }

    private UUID getUserId(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userEmail))
                .getId();
    }

    private String generateSubdomain(String siteName) {
        return siteName.toLowerCase()
                .replaceAll("[^a-z0-9]", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "")
                + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String getDefaultStyles(BusinessType businessType) {
        return switch (businessType) {
            case LANDING -> "{\"primaryColor\":\"#7C3AED\",\"secondaryColor\":\"#4F46E5\",\"fontFamily\":\"Inter\",\"backgroundColor\":\"#ffffff\",\"textColor\":\"#111827\"}";
            case ECOMMERCE -> "{\"primaryColor\":\"#059669\",\"secondaryColor\":\"#0D9488\",\"fontFamily\":\"Inter\",\"backgroundColor\":\"#f9fafb\",\"textColor\":\"#111827\"}";
            case MUSIC_LABEL -> "{\"primaryColor\":\"#DC2626\",\"secondaryColor\":\"#9333EA\",\"fontFamily\":\"Space Grotesk\",\"backgroundColor\":\"#0f0f0f\",\"textColor\":\"#ffffff\"}";
            case FITNESS -> "{\"primaryColor\":\"#EA580C\",\"secondaryColor\":\"#D97706\",\"fontFamily\":\"Barlow\",\"backgroundColor\":\"#111827\",\"textColor\":\"#ffffff\"}";
        };
    }

    private String getDefaultSeoMeta(String siteName) {
        return "{\"title\":\"" + siteName + "\",\"description\":\"Welcome to " + siteName + "\",\"keywords\":\"\",\"ogImage\":\"\"}";
    }

    private List<Block> createDefaultBlocks(Site site, BusinessType businessType) {
        List<Block> blocks = new ArrayList<>();

        blocks.add(Block.builder()
                .type("HERO").position(0)
                .content(getHeroContent(businessType, site.getName()))
                .styles("{\"minHeight\":\"80vh\",\"textAlign\":\"center\"}")
                .site(site).build());

        blocks.add(Block.builder()
                .type("FEATURES").position(1)
                .content(getFeaturesContent(businessType))
                .styles("{\"padding\":\"80px 0\",\"backgroundColor\":\"#f9fafb\"}")
                .site(site).build());

        switch (businessType) {
            case ECOMMERCE -> blocks.add(Block.builder().type("PRODUCT_GRID").position(2)
                    .content("{\"title\":\"Наши товары\",\"columns\":3,\"products\":[]}")
                    .styles("{\"padding\":\"60px 0\"}").site(site).build());
            case MUSIC_LABEL -> blocks.add(Block.builder().type("MUSIC_PLAYER").position(2)
                    .content("{\"title\":\"Последние релизы\",\"tracks\":[]}")
                    .styles("{\"padding\":\"60px 0\",\"backgroundColor\":\"#1a1a1a\"}").site(site).build());
            case FITNESS -> blocks.add(Block.builder().type("SCHEDULE").position(2)
                    .content("{\"title\":\"Расписание занятий\",\"classes\":[]}")
                    .styles("{\"padding\":\"60px 0\"}").site(site).build());
            case LANDING -> blocks.add(Block.builder().type("PRICING").position(2)
                    .content("{\"title\":\"Тарифы\",\"plans\":[]}")
                    .styles("{\"padding\":\"60px 0\"}").site(site).build());
        }

        blocks.add(Block.builder().type("CONTACTS").position(blocks.size())
                .content("{\"title\":\"Свяжитесь с нами\",\"email\":\"\",\"phone\":\"\",\"address\":\"\"}")
                .styles("{\"padding\":\"60px 0\",\"backgroundColor\":\"#111827\",\"color\":\"#fff\"}")
                .site(site).build());

        return blocks;
    }

    private String getHeroContent(BusinessType type, String siteName) {
        return switch (type) {
            case LANDING -> "{\"title\":\"" + siteName + "\",\"subtitle\":\"Лучшее решение для вашего бизнеса\",\"ctaText\":\"Начать бесплатно\",\"ctaUrl\":\"#contact\"}";
            case ECOMMERCE -> "{\"title\":\"" + siteName + "\",\"subtitle\":\"Качественные товары с доставкой\",\"ctaText\":\"В каталог\",\"ctaUrl\":\"#products\"}";
            case MUSIC_LABEL -> "{\"title\":\"" + siteName + "\",\"subtitle\":\"Музыка, которая вдохновляет\",\"ctaText\":\"Слушать\",\"ctaUrl\":\"#player\"}";
            case FITNESS -> "{\"title\":\"" + siteName + "\",\"subtitle\":\"Твой путь к здоровью начинается здесь\",\"ctaText\":\"Записаться\",\"ctaUrl\":\"#schedule\"}";
        };
    }

    private String getFeaturesContent(BusinessType type) {
        return switch (type) {
            case LANDING -> "{\"title\":\"Почему выбирают нас\",\"items\":[{\"icon\":\"⚡\",\"title\":\"Быстро\",\"text\":\"Мгновенный результат\"},{\"icon\":\"🛡️\",\"title\":\"Надёжно\",\"text\":\"Гарантия качества\"},{\"icon\":\"💡\",\"title\":\"Умно\",\"text\":\"Инновационный подход\"}]}";
            case ECOMMERCE -> "{\"title\":\"Наши преимущества\",\"items\":[{\"icon\":\"🚚\",\"title\":\"Быстрая доставка\",\"text\":\"1-2 дня\"},{\"icon\":\"✅\",\"title\":\"Гарантия\",\"text\":\"30 дней возврата\"},{\"icon\":\"🔒\",\"title\":\"Безопасно\",\"text\":\"Защищённые платежи\"}]}";
            case MUSIC_LABEL -> "{\"title\":\"О нас\",\"items\":[{\"icon\":\"🎵\",\"title\":\"Продюсирование\",\"text\":\"Профессиональная студия\"},{\"icon\":\"🌍\",\"title\":\"Дистрибуция\",\"text\":\"По всему миру\"},{\"icon\":\"📈\",\"title\":\"Продвижение\",\"text\":\"SMM и PR\"}]}";
            case FITNESS -> "{\"title\":\"Наши услуги\",\"items\":[{\"icon\":\"💪\",\"title\":\"Тренажёрный зал\",\"text\":\"Современное оборудование\"},{\"icon\":\"🧘\",\"title\":\"Йога и пилатес\",\"text\":\"Для всех уровней\"},{\"icon\":\"🏊\",\"title\":\"Бассейн\",\"text\":\"25-метровый бассейн\"}]}";
        };
    }
}
