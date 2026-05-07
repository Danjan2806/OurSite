package com.saas.controller;

import com.saas.dto.BlockResponse;
import com.saas.dto.CreateBlockRequest;
import com.saas.dto.ReorderBlocksRequest;
import com.saas.dto.UpdateBlockRequest;
import com.saas.service.SiteBuilderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class BlockController {

    private final SiteBuilderService siteBuilderService;

    @PostMapping("/sites/{siteId}/blocks")
    public ResponseEntity<BlockResponse> addBlock(
            @PathVariable UUID siteId,
            @Valid @RequestBody CreateBlockRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        BlockResponse response = siteBuilderService.addBlock(siteId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/blocks/{id}")
    public ResponseEntity<BlockResponse> updateBlock(
            @PathVariable UUID id,
            @RequestBody UpdateBlockRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.updateBlock(id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/blocks/{id}")
    public ResponseEntity<Void> deleteBlock(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        siteBuilderService.deleteBlock(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/sites/{siteId}/blocks/reorder")
    public ResponseEntity<List<BlockResponse>> reorderBlocks(
            @PathVariable UUID siteId,
            @Valid @RequestBody ReorderBlocksRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(siteBuilderService.reorderBlocks(siteId, request, userDetails.getUsername()));
    }
}
