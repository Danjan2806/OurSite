'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Button, IconButton, Tooltip, CircularProgress,
  Chip, Snackbar, Alert, Breadcrumbs, Link as MuiLink,
} from '@mui/material';
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  ArrowBack, Launch, Publish, Visibility, VisibilityOff, Menu,
  AutoAwesome, Preview,
} from '@mui/icons-material';
import BlockPalette from '@/components/BlockPalette';
import Canvas from '@/components/Canvas';
import StyleEditor from '@/components/StyleEditor';
import { useBuilder } from '@/hooks/useBuilder';
import { usePublishSite } from '@/hooks/useSites';
import { useBuilderStore, useAuthStore } from '@/lib/store';

interface Block {
  id: string;
  type: string;
  position: number;
  content: string;
  styles: string;
  visible: boolean;
}

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;
  const { user } = useAuthStore();
  const { selectedBlockId, previewMode, sidebarOpen, togglePreview, toggleSidebar, setSelectedBlock } = useBuilderStore();

  const { site, isLoading, addBlock, updateBlock, deleteBlock, reorderBlocks, updateStyles } = useBuilder(siteId);
  const publishSite = usePublishSite();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [publishSuccess, setPublishSuccess] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  useEffect(() => {
    if (site?.blocks && Array.isArray(site.blocks)) {
      const sorted = [...(site.blocks as Block[])].sort((a, b) => a.position - b.position);
      setBlocks(sorted);
    }
  }, [site?.blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;

      // Drop from palette to canvas
      if (active.data.current?.fromPalette) {
        const blockType = active.data.current.type as string;
        const position = blocks.length;
        await addBlock.mutateAsync({ type: blockType, position });
        return;
      }

      // Reorder within canvas
      if (active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        const newOrder = arrayMove(blocks, oldIndex, newIndex);
        setBlocks(newOrder);
        await reorderBlocks.mutateAsync(newOrder.map((b) => b.id));
      }
    },
    [blocks, addBlock, reorderBlocks]
  );

  const handleUpdateBlock = useCallback(
    (id: string, data: { content?: string; styles?: string; visible?: boolean }) => {
      updateBlock.mutate({ id, ...data });
    },
    [updateBlock]
  );

  const handleDeleteBlock = useCallback(
    (id: string) => {
      deleteBlock.mutate(id);
      setSelectedBlock(null);
    },
    [deleteBlock, setSelectedBlock]
  );

  const handleToggleVisibility = useCallback(
    (id: string, visible: boolean) => {
      updateBlock.mutate({ id, visible });
    },
    [updateBlock]
  );

  const handlePublish = async () => {
    try {
      const result = await publishSite.mutateAsync(siteId);
      setPublishSuccess(result.url);
    } catch { /* handled in hook */ }
  };

  const selectedBlock = selectedBlockId
    ? (blocks.find((b) => b.id === selectedBlockId) ?? null)
    : null;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#7C3AED', mb: 2 }} />
          <Typography color="text.secondary">Загрузка конструктора...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top toolbar */}
      <Box
        sx={{
          height: 56, px: 2, display: 'flex', alignItems: 'center', gap: 1,
          borderBottom: '1px solid', borderColor: 'divider',
          bgcolor: 'background.paper', zIndex: 100, flexShrink: 0,
        }}
      >
        {/* Left */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Tooltip title="К дашборду">
            <IconButton size="small" onClick={() => router.push('/dashboard')}>
              <ArrowBack fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Панель блоков">
            <IconButton size="small" onClick={toggleSidebar}>
              <Menu fontSize="small" />
            </IconButton>
          </Tooltip>
          <Box
            sx={{
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              borderRadius: 1.5, p: 0.5, display: 'flex', mr: 1,
            }}
          >
            <AutoAwesome sx={{ fontSize: 18 }} />
          </Box>
          <Breadcrumbs separator="›">
            <MuiLink
              onClick={() => router.push('/dashboard')}
              sx={{ cursor: 'pointer', fontSize: 13 }}
              color="text.secondary"
              underline="hover"
            >
              Сайты
            </MuiLink>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>
              {(site as { name?: string } | undefined)?.name || '...'}
            </Typography>
          </Breadcrumbs>
          <Chip
            label={(site as { status?: string } | undefined)?.status === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
            size="small"
            sx={{
              height: 20, fontSize: 11,
              bgcolor: (site as { status?: string } | undefined)?.status === 'PUBLISHED' ? '#05966920' : '#D9780620',
              color: (site as { status?: string } | undefined)?.status === 'PUBLISHED' ? '#059669' : '#D97806',
            }}
          />
        </Box>

        {/* Center */}
        <Typography variant="caption" color="text.secondary" sx={{ px: 2 }}>
          {blocks.length} блоков
        </Typography>

        {/* Right */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title={previewMode ? 'Режим редактирования' : 'Предпросмотр'}>
            <Button
              size="small"
              startIcon={previewMode ? <VisibilityOff /> : <Preview />}
              onClick={togglePreview}
              variant="outlined"
              sx={{ borderColor: 'rgba(255,255,255,0.12)', fontSize: 13 }}
            >
              {previewMode ? 'Редактировать' : 'Превью'}
            </Button>
          </Tooltip>
          {(site as { publishedUrl?: string } | undefined)?.publishedUrl && (
            <Tooltip title="Открыть опубликованный сайт">
              <IconButton
                size="small"
                href={(site as { publishedUrl: string }).publishedUrl}
                target="_blank"
              >
                <Launch fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<Publish />}
            onClick={handlePublish}
            disabled={publishSite.isPending}
            sx={{ background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', fontWeight: 700 }}
          >
            {publishSite.isPending ? 'Публикую...' : 'Опубликовать'}
          </Button>
        </Box>
      </Box>

      {/* Builder area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Left palette */}
          <AnimatePresence>
            {sidebarOpen && !previewMode && (
              <motion.div
                initial={{ x: -240, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -240, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex' }}
              >
                <BlockPalette businessType={(site as { businessType?: string } | undefined)?.businessType || 'LANDING'} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Canvas */}
          <Canvas
            blocks={blocks}
            onDeleteBlock={handleDeleteBlock}
            onToggleVisibility={handleToggleVisibility}
            previewMode={previewMode}
          />

          {/* Right style editor */}
          <AnimatePresence>
            {!previewMode && (
              <motion.div
                initial={{ x: 280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 280, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex' }}
              >
                <StyleEditor
                  selectedBlock={selectedBlock}
                  globalStyles={(site as { globalStyles?: string } | undefined)?.globalStyles || '{}'}
                  onUpdateBlock={handleUpdateBlock}
                  onUpdateGlobalStyles={(styles) => updateStyles.mutate(styles)}
                  onDeleteBlock={handleDeleteBlock}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </DndContext>
      </Box>

      {/* Publish success notification */}
      <Snackbar
        open={!!publishSuccess}
        autoHideDuration={6000}
        onClose={() => setPublishSuccess('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setPublishSuccess('')} sx={{ borderRadius: 2 }}>
          Сайт опубликован! URL: <strong>{publishSuccess}</strong>
        </Alert>
      </Snackbar>
    </Box>
  );
}
