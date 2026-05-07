package com.saas.controller;

import com.saas.dto.BusinessType;
import com.saas.service.QueryTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/templates")
@RequiredArgsConstructor
public class TemplateController {

    private final QueryTemplateService queryTemplateService;

    @GetMapping("/queries/{businessType}")
    public ResponseEntity<Map<String, String>> getQueries(@PathVariable BusinessType businessType) {
        return ResponseEntity.ok(queryTemplateService.getQueriesForBusinessType(businessType));
    }

    @GetMapping("/queries/{businessType}/names")
    public ResponseEntity<List<String>> getQueryNames(@PathVariable BusinessType businessType) {
        return ResponseEntity.ok(queryTemplateService.getAvailableQueryNames(businessType));
    }

    @GetMapping("/blocks/{businessType}")
    public ResponseEntity<List<Map<String, Object>>> getAvailableBlocks(@PathVariable BusinessType businessType) {
        List<Map<String, Object>> blocks = switch (businessType) {
            case LANDING -> List.of(
                    Map.of("type", "HERO", "label", "Hero секция", "icon", "heroicons:home"),
                    Map.of("type", "FEATURES", "label", "Преимущества", "icon", "heroicons:star"),
                    Map.of("type", "PRICING", "label", "Тарифы", "icon", "heroicons:currency-dollar"),
                    Map.of("type", "TESTIMONIALS", "label", "Отзывы", "icon", "heroicons:chat-bubble-left"),
                    Map.of("type", "FAQ", "label", "FAQ", "icon", "heroicons:question-mark-circle"),
                    Map.of("type", "CONTACTS", "label", "Контакты", "icon", "heroicons:envelope"),
                    Map.of("type", "LEAD_FORM", "label", "Форма захвата", "icon", "heroicons:pencil-square")
            );
            case ECOMMERCE -> List.of(
                    Map.of("type", "HERO", "label", "Hero секция", "icon", "heroicons:home"),
                    Map.of("type", "FEATURES", "label", "Преимущества", "icon", "heroicons:star"),
                    Map.of("type", "PRODUCT_GRID", "label", "Сетка товаров", "icon", "heroicons:shopping-bag"),
                    Map.of("type", "CATEGORIES", "label", "Категории", "icon", "heroicons:squares-2x2"),
                    Map.of("type", "CART", "label", "Корзина", "icon", "heroicons:shopping-cart"),
                    Map.of("type", "CONTACTS", "label", "Контакты", "icon", "heroicons:envelope")
            );
            case MUSIC_LABEL -> List.of(
                    Map.of("type", "HERO", "label", "Hero секция", "icon", "heroicons:home"),
                    Map.of("type", "MUSIC_PLAYER", "label", "Плеер", "icon", "heroicons:musical-note"),
                    Map.of("type", "ARTISTS", "label", "Артисты", "icon", "heroicons:user-group"),
                    Map.of("type", "RELEASES", "label", "Релизы", "icon", "heroicons:rectangle-stack"),
                    Map.of("type", "ARTIST_CABINET", "label", "Личный кабинет", "icon", "heroicons:identification"),
                    Map.of("type", "CONTACTS", "label", "Контакты", "icon", "heroicons:envelope")
            );
            case FITNESS -> List.of(
                    Map.of("type", "HERO", "label", "Hero секция", "icon", "heroicons:home"),
                    Map.of("type", "FEATURES", "label", "Услуги", "icon", "heroicons:star"),
                    Map.of("type", "SCHEDULE", "label", "Расписание", "icon", "heroicons:calendar"),
                    Map.of("type", "TRAINERS", "label", "Тренеры", "icon", "heroicons:user-group"),
                    Map.of("type", "MEMBERSHIPS", "label", "Абонементы", "icon", "heroicons:credit-card"),
                    Map.of("type", "CONTACTS", "label", "Контакты", "icon", "heroicons:envelope")
            );
        };
        return ResponseEntity.ok(blocks);
    }

    @GetMapping("/business-types")
    public ResponseEntity<List<Map<String, Object>>> getBusinessTypes() {
        return ResponseEntity.ok(List.of(
                Map.of("type", "LANDING", "label", "Лендинг", "description", "Одностраничный сайт для захвата лидов", "icon", "🚀"),
                Map.of("type", "ECOMMERCE", "label", "Интернет-магазин", "description", "Каталог товаров, корзина, заказы", "icon", "🛒"),
                Map.of("type", "MUSIC_LABEL", "label", "Музыкальный лейбл", "description", "Артисты, треки, личный кабинет", "icon", "🎵"),
                Map.of("type", "FITNESS", "label", "Фитнес-клуб", "description", "Расписание, тренеры, абонементы", "icon", "💪")
        ));
    }
}
