package com.saas.service;

import com.saas.entity.Block;
import com.saas.entity.Site;
import com.saas.repository.BlockRepository;
import com.saas.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PublishService {

    private final SiteRepository siteRepository;
    private final BlockRepository blockRepository;

    @Value("${app.site.generated-path:./generated}")
    private String generatedPath;

    @Value("${app.site.base-domain:saas.local}")
    private String baseDomain;

    @Transactional
    public String publishSite(UUID siteId, String userEmail) throws IOException {
        Site site = siteRepository.findById(siteId)
                .orElseThrow(() -> new RuntimeException("Site not found: " + siteId));

        if (!site.getTenant().getOwner().getEmail().equals(userEmail)) {
            throw new RuntimeException("Access denied");
        }

        List<Block> blocks = blockRepository.findBySiteOrderByPositionAsc(site);

        // Build the static HTML/CSS/JS output
        String html = generateHtml(site, blocks);
        String css = generateCss(site);
        String js = generateJs(site, blocks);

        // Write to local filesystem (simulating S3/CDN upload)
        Path siteDir = Paths.get(generatedPath, site.getSubdomain());
        Files.createDirectories(siteDir);
        Files.writeString(siteDir.resolve("index.html"), html);
        Files.writeString(siteDir.resolve("styles.css"), css);
        Files.writeString(siteDir.resolve("app.js"), js);
        Files.writeString(siteDir.resolve("manifest.json"), generateManifest(site));

        String publishedUrl = "http://" + site.getSubdomain() + "." + baseDomain;
        site.setStatus(Site.SiteStatus.PUBLISHED);
        site.setPublishedUrl(publishedUrl);
        site.setPublishedAt(LocalDateTime.now());
        siteRepository.save(site);

        log.info("Site {} published at {}", siteId, publishedUrl);
        return publishedUrl;
    }

    private String generateHtml(Site site, List<Block> blocks) {
        StringBuilder blocksHtml = new StringBuilder();
        for (Block block : blocks) {
            if (block.isVisible()) {
                blocksHtml.append(renderBlock(block));
            }
        }

        return """
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>%s</title>
                    <link rel="stylesheet" href="styles.css">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
                </head>
                <body>
                    <main id="app">
                %s
                    </main>
                    <script src="app.js"></script>
                </body>
                </html>
                """.formatted(site.getName(), blocksHtml.toString());
    }

    private String renderBlock(Block block) {
        return switch (block.getType()) {
            case "HERO" -> renderHero(block);
            case "FEATURES" -> renderFeatures(block);
            case "PRODUCT_GRID" -> renderProductGrid(block);
            case "MUSIC_PLAYER" -> renderMusicPlayer(block);
            case "SCHEDULE" -> renderSchedule(block);
            case "PRICING" -> renderPricing(block);
            case "CONTACTS" -> renderContacts(block);
            default -> "<section class=\"block block-" + block.getType().toLowerCase() + "\" data-block-id=\"" + block.getId() + "\"></section>";
        };
    }

    private String renderHero(Block block) {
        return """
                <section class="hero-section" id="hero" style="%s">
                    <div class="container">
                        <div class="hero-content" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String renderFeatures(Block block) {
        return """
                <section class="features-section" id="features" style="%s">
                    <div class="container">
                        <div class="features-content" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String renderProductGrid(Block block) {
        return """
                <section class="products-section" id="products" style="%s">
                    <div class="container">
                        <div class="products-grid" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String renderMusicPlayer(Block block) {
        return """
                <section class="player-section" id="player" style="%s">
                    <div class="container">
                        <div class="music-player" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String renderSchedule(Block block) {
        return """
                <section class="schedule-section" id="schedule" style="%s">
                    <div class="container">
                        <div class="schedule-grid" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String renderPricing(Block block) {
        return """
                <section class="pricing-section" id="pricing" style="%s">
                    <div class="container">
                        <div class="pricing-grid" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String renderContacts(Block block) {
        return """
                <section class="contacts-section" id="contacts" style="%s">
                    <div class="container">
                        <div class="contacts-content" data-content='%s'></div>
                    </div>
                </section>
                """.formatted(block.getStyles(), block.getContent());
    }

    private String generateCss(Site site) {
        String styles = site.getGlobalStyles();
        return """
                :root {
                    --primary: #7C3AED;
                    --secondary: #4F46E5;
                    --font: 'Inter', sans-serif;
                    --bg: #ffffff;
                    --text: #111827;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: var(--font); color: var(--text); background: var(--bg); }
                .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
                .hero-section { min-height: 80vh; display: flex; align-items: center; background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%); color: white; }
                .features-section { padding: 80px 0; }
                .products-section { padding: 60px 0; }
                .player-section { padding: 60px 0; background: #0f0f0f; color: white; }
                .schedule-section { padding: 60px 0; }
                .pricing-section { padding: 60px 0; background: #f9fafb; }
                .contacts-section { padding: 60px 0; background: #111827; color: white; }
                @media (max-width: 768px) { .container { padding: 0 16px; } }
                @media (max-width: 480px) { .hero-section { min-height: 60vh; } }
                """;
    }

    private String generateJs(Site site, List<Block> blocks) {
        return """
                (function() {
                    'use strict';
                    const siteId = '%s';
                    const blocks = %s;
                    
                    function renderHero(el, content) {
                        el.innerHTML = `
                            <h1 style="font-size:3rem;font-weight:800;margin-bottom:1rem">${content.title || ''}</h1>
                            <p style="font-size:1.25rem;margin-bottom:2rem;opacity:0.9">${content.subtitle || ''}</p>
                            ${content.ctaText ? `<a href="${content.ctaUrl}" style="display:inline-block;padding:16px 40px;background:white;color:#7C3AED;border-radius:8px;font-weight:700;text-decoration:none">${content.ctaText}</a>` : ''}
                        `;
                    }
                    
                    function renderFeatures(el, content) {
                        const items = (content.items || []).map(item =>
                            `<div style="text-align:center;padding:32px 16px">
                                <div style="font-size:3rem;margin-bottom:1rem">${item.icon}</div>
                                <h3 style="font-size:1.25rem;font-weight:700;margin-bottom:0.5rem">${item.title}</h3>
                                <p style="color:#6B7280">${item.text}</p>
                            </div>`
                        ).join('');
                        el.innerHTML = `
                            <h2 style="text-align:center;font-size:2rem;font-weight:800;margin-bottom:3rem">${content.title || ''}</h2>
                            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px">${items}</div>
                        `;
                    }
                    
                    document.addEventListener('DOMContentLoaded', function() {
                        document.querySelectorAll('[data-content]').forEach(function(el) {
                            try {
                                const content = JSON.parse(el.getAttribute('data-content'));
                                const section = el.closest('section');
                                if (section.classList.contains('hero-section')) renderHero(el, content);
                                if (section.classList.contains('features-section')) renderFeatures(el, content);
                            } catch(e) { console.error('Block render error:', e); }
                        });
                    });
                })();
                """.formatted(site.getId(), "[]");
    }

    private String generateManifest(Site site) {
        return """
                {
                    "siteId": "%s",
                    "name": "%s",
                    "subdomain": "%s",
                    "businessType": "%s",
                    "publishedAt": "%s",
                    "version": "1.0.0"
                }
                """.formatted(
                site.getId(),
                site.getName(),
                site.getSubdomain(),
                site.getBusinessType(),
                LocalDateTime.now()
        );
    }
}
