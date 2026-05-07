package com.lilluucore.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    @Value("${storage.upload-dir:/app/uploads}")
    private String uploadDir;

    @PostMapping("/uploads/request-url")
    public ResponseEntity<?> requestUploadUrl(@AuthenticationPrincipal String userId,
                                              @RequestBody Map<String, Object> body) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        String name = (String) body.get("name");
        String contentType = (String) body.get("contentType");
        if (name == null || contentType == null)
            return ResponseEntity.badRequest().body(Map.of("error", "Missing required fields"));

        String objectId = UUID.randomUUID().toString();
        String objectPath = "/objects/" + objectId;
        String uploadURL = "/api/storage/upload-direct/" + objectId;

        return ResponseEntity.ok(Map.of(
            "uploadURL", uploadURL,
            "objectPath", objectPath,
            "metadata", Map.of("name", name, "size", body.getOrDefault("size", 0), "contentType", contentType)
        ));
    }

    @PostMapping("/upload-direct/{objectId}")
    public ResponseEntity<?> uploadDirect(@AuthenticationPrincipal String userId,
                                          @PathVariable String objectId,
                                          @RequestParam("file") MultipartFile file) {
        if (userId == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        try {
            Path dir = Paths.get(uploadDir, "objects");
            Files.createDirectories(dir);
            Path dest = dir.resolve(objectId);
            file.transferTo(dest.toFile());
            return ResponseEntity.ok(Map.of("ok", true, "objectPath", "/objects/" + objectId));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed"));
        }
    }

    @PutMapping("/upload-direct/{objectId}")
    public ResponseEntity<?> uploadDirectPut(@AuthenticationPrincipal String userId,
                                             @PathVariable String objectId,
                                             HttpServletRequest request) {
        try {
            Path dir = Paths.get(uploadDir, "objects");
            Files.createDirectories(dir);
            Path dest = dir.resolve(objectId);
            Files.copy(request.getInputStream(), dest, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed"));
        }
    }

    @GetMapping("/objects/{objectId}")
    public ResponseEntity<Resource> serveObject(@PathVariable String objectId) {
        Path filePath = Paths.get(uploadDir, "objects", objectId);
        if (!filePath.toFile().exists())
            return ResponseEntity.notFound().build();
        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
            .body(resource);
    }

    @GetMapping("/public-objects/{*filePath}")
    public ResponseEntity<Resource> servePublicObject(@PathVariable String filePath) {
        Path path = Paths.get(uploadDir, "public", filePath);
        if (!path.toFile().exists())
            return ResponseEntity.notFound().build();
        Resource resource = new FileSystemResource(path);
        return ResponseEntity.ok()
            .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
            .body(resource);
    }
}
