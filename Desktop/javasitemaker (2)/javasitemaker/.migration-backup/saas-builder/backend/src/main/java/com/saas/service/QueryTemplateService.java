package com.saas.service;

import com.saas.dto.BusinessType;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Manages pre-built SQL queries for each business type.
 * Returns ready-to-use named queries for tenant databases.
 */
@Service
public class QueryTemplateService {

    public Map<String, String> getQueriesForBusinessType(BusinessType type) {
        return switch (type) {
            case LANDING -> getLandingQueries();
            case ECOMMERCE -> getEcommerceQueries();
            case MUSIC_LABEL -> getMusicLabelQueries();
            case FITNESS -> getFitnessQueries();
        };
    }

    public List<String> getAvailableQueryNames(BusinessType type) {
        return getQueriesForBusinessType(type).keySet().stream().sorted().toList();
    }

    private Map<String, String> getLandingQueries() {
        Map<String, String> queries = new HashMap<>();
        queries.put("getLeads", "SELECT * FROM leads ORDER BY created_at DESC");
        queries.put("getLeadById", "SELECT * FROM leads WHERE id = ?");
        queries.put("createLead", "INSERT INTO leads (name, email, phone, message, source) VALUES (?, ?, ?, ?, ?) RETURNING *");
        queries.put("updateLead", "UPDATE leads SET status = ?, notes = ?, updated_at = NOW() WHERE id = ? RETURNING *");
        queries.put("deleteLead", "DELETE FROM leads WHERE id = ?");
        queries.put("getLeadsByStatus", "SELECT * FROM leads WHERE status = ? ORDER BY created_at DESC");
        queries.put("getLeadStats", "SELECT status, COUNT(*) as count FROM leads GROUP BY status");
        queries.put("getTestimonials", "SELECT * FROM testimonials WHERE active = true ORDER BY position ASC");
        queries.put("createTestimonial", "INSERT INTO testimonials (author, role, text, avatar_url, rating) VALUES (?, ?, ?, ?, ?) RETURNING *");
        queries.put("getFaqs", "SELECT * FROM faqs WHERE active = true ORDER BY position ASC");
        queries.put("getAnalytics", "SELECT DATE_TRUNC('day', created_at) as day, COUNT(*) as visits FROM page_views GROUP BY day ORDER BY day DESC LIMIT 30");
        return queries;
    }

    private Map<String, String> getEcommerceQueries() {
        Map<String, String> queries = new HashMap<>();
        queries.put("getProducts", "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.active = true ORDER BY p.created_at DESC");
        queries.put("getProductById", "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?");
        queries.put("createProduct", "INSERT INTO products (name, description, price, stock, category_id, images, sku) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *");
        queries.put("updateProduct", "UPDATE products SET name=?, description=?, price=?, stock=?, updated_at=NOW() WHERE id=? RETURNING *");
        queries.put("deleteProduct", "UPDATE products SET active = false WHERE id = ?");
        queries.put("getCategories", "SELECT * FROM categories ORDER BY name ASC");
        queries.put("getOrders", "SELECT o.*, u.email as customer_email FROM orders o LEFT JOIN customers u ON o.customer_id = u.id ORDER BY o.created_at DESC");
        queries.put("getOrderById", "SELECT o.*, oi.product_id, oi.quantity, oi.price as item_price, p.name as product_name FROM orders o JOIN order_items oi ON oi.order_id = o.id JOIN products p ON p.id = oi.product_id WHERE o.id = ?");
        queries.put("createOrder", "INSERT INTO orders (customer_id, total_amount, status, shipping_address) VALUES (?, ?, 'pending', ?) RETURNING *");
        queries.put("updateOrderStatus", "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ? RETURNING *");
        queries.put("getCartItems", "SELECT ci.*, p.name, p.price, p.images FROM cart_items ci JOIN products p ON p.id = ci.product_id WHERE ci.session_id = ?");
        queries.put("addToCart", "INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?) ON CONFLICT (session_id, product_id) DO UPDATE SET quantity = cart_items.quantity + ? RETURNING *");
        queries.put("removeFromCart", "DELETE FROM cart_items WHERE session_id = ? AND product_id = ?");
        queries.put("getSalesStats", "SELECT SUM(total_amount) as revenue, COUNT(*) as orders FROM orders WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed'");
        queries.put("getTopProducts", "SELECT p.name, SUM(oi.quantity) as sold FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.id, p.name ORDER BY sold DESC LIMIT 10");
        return queries;
    }

    private Map<String, String> getMusicLabelQueries() {
        Map<String, String> queries = new HashMap<>();
        queries.put("getArtists", "SELECT * FROM artists ORDER BY name ASC");
        queries.put("getArtistById", "SELECT a.*, COUNT(r.id) as release_count FROM artists a LEFT JOIN releases r ON r.artist_id = a.id WHERE a.id = ? GROUP BY a.id");
        queries.put("updateArtistProfile", "UPDATE artists SET bio=?, genres=?, social_links=?, avatar_url=?, updated_at=NOW() WHERE id=? RETURNING *");
        queries.put("getReleases", "SELECT r.*, a.name as artist_name FROM releases r JOIN artists a ON a.id = r.artist_id ORDER BY r.release_date DESC");
        queries.put("getReleaseById", "SELECT r.*, a.name as artist_name FROM releases r JOIN artists a ON a.id = r.artist_id WHERE r.id = ?");
        queries.put("addRelease", "INSERT INTO releases (artist_id, title, release_type, release_date, cover_url, description) VALUES (?, ?, ?, ?, ?, ?) RETURNING *");
        queries.put("getTopTracks", "SELECT t.*, r.title as release_title, a.name as artist_name FROM tracks t JOIN releases r ON r.id = t.release_id JOIN artists a ON a.id = r.artist_id ORDER BY t.plays DESC LIMIT 20");
        queries.put("getTracksByRelease", "SELECT * FROM tracks WHERE release_id = ? ORDER BY track_number ASC");
        queries.put("addTrack", "INSERT INTO tracks (release_id, title, duration, audio_url, track_number) VALUES (?, ?, ?, ?, ?) RETURNING *");
        queries.put("incrementTrackPlay", "UPDATE tracks SET plays = plays + 1 WHERE id = ? RETURNING plays");
        queries.put("getArtistDashboard", "SELECT a.name, COUNT(DISTINCT r.id) as releases, COUNT(DISTINCT t.id) as tracks, SUM(t.plays) as total_plays FROM artists a LEFT JOIN releases r ON r.artist_id = a.id LEFT JOIN tracks t ON t.release_id = r.id WHERE a.id = ? GROUP BY a.id, a.name");
        queries.put("getArtistProfile", "SELECT * FROM artists WHERE user_id = ?");
        queries.put("getRecentPlays", "SELECT t.title, r.title as release, a.name as artist, ph.played_at FROM play_history ph JOIN tracks t ON t.id = ph.track_id JOIN releases r ON r.id = t.release_id JOIN artists a ON a.id = r.artist_id ORDER BY ph.played_at DESC LIMIT 50");
        return queries;
    }

    private Map<String, String> getFitnessQueries() {
        Map<String, String> queries = new HashMap<>();
        queries.put("getClasses", "SELECT c.*, t.name as trainer_name, COUNT(b.id) as bookings FROM classes c LEFT JOIN trainers t ON t.id = c.trainer_id LEFT JOIN bookings b ON b.class_id = c.id WHERE c.date_time >= NOW() GROUP BY c.id, t.name ORDER BY c.date_time ASC");
        queries.put("getClassById", "SELECT c.*, t.name as trainer_name, t.bio as trainer_bio FROM classes c JOIN trainers t ON t.id = c.trainer_id WHERE c.id = ?");
        queries.put("createClass", "INSERT INTO classes (title, description, trainer_id, date_time, duration_minutes, max_participants, class_type, room) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *");
        queries.put("updateClass", "UPDATE classes SET title=?, description=?, date_time=?, duration_minutes=?, max_participants=?, room=?, updated_at=NOW() WHERE id=? RETURNING *");
        queries.put("deleteClass", "UPDATE classes SET active = false WHERE id = ?");
        queries.put("getBookings", "SELECT b.*, m.name as member_name, m.email as member_email, c.title as class_title, c.date_time FROM bookings b JOIN members m ON m.id = b.member_id JOIN classes c ON c.id = b.class_id ORDER BY b.created_at DESC");
        queries.put("createBooking", "INSERT INTO bookings (member_id, class_id, status) VALUES (?, ?, 'confirmed') RETURNING *");
        queries.put("cancelBooking", "UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND member_id = ? RETURNING *");
        queries.put("getMemberBookings", "SELECT b.*, c.title, c.date_time, c.duration_minutes, t.name as trainer_name FROM bookings b JOIN classes c ON c.id = b.class_id LEFT JOIN trainers t ON t.id = c.trainer_id WHERE b.member_id = ? AND b.status != 'cancelled' ORDER BY c.date_time DESC");
        queries.put("getMemberships", "SELECT m.*, mt.name as type_name, mt.price FROM memberships m JOIN membership_types mt ON mt.id = m.type_id WHERE m.member_id = ? AND m.expires_at > NOW()");
        queries.put("createMembership", "INSERT INTO memberships (member_id, type_id, starts_at, expires_at, status) VALUES (?, ?, ?, ?, 'active') RETURNING *");
        queries.put("getTrainers", "SELECT t.*, COUNT(c.id) as class_count FROM trainers t LEFT JOIN classes c ON c.trainer_id = t.id WHERE t.active = true GROUP BY t.id ORDER BY t.name ASC");
        queries.put("getSchedule", "SELECT c.*, t.name as trainer_name FROM classes c JOIN trainers t ON t.id = c.trainer_id WHERE c.date_time BETWEEN ? AND ? AND c.active = true ORDER BY c.date_time ASC");
        queries.put("getMemberStats", "SELECT COUNT(b.id) as total_bookings, COUNT(CASE WHEN b.status='attended' THEN 1 END) as attended, MAX(c.date_time) as last_visit FROM bookings b JOIN classes c ON c.id = b.class_id WHERE b.member_id = ?");
        return queries;
    }
}
