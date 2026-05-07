'use client';

import { Box, Typography, Paper, IconButton, Tooltip, Chip } from '@mui/material';
import { DragOverlay, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DragIndicator, Delete, Visibility, VisibilityOff, Edit,
} from '@mui/icons-material';
import { useBuilderStore } from '@/lib/store';

interface Block {
  id: string;
  type: string;
  position: number;
  content: string;
  styles: string;
  visible: boolean;
}

const BLOCK_COLORS: Record<string, string> = {
  HERO: '#7C3AED', FEATURES: '#4F46E5', PRICING: '#059669', CONTACTS: '#0284C7',
  PRODUCT_GRID: '#D97706', MUSIC_PLAYER: '#DC2626', SCHEDULE: '#EA580C',
  TESTIMONIALS: '#DB2777', FAQ: '#7C3AED', LEAD_FORM: '#059669',
  ARTISTS: '#DC2626', RELEASES: '#DC2626', TRAINERS: '#EA580C', MEMBERSHIPS: '#D97706',
};

const BLOCK_LABELS: Record<string, string> = {
  HERO: '🎯 Hero секция', FEATURES: '⭐ Преимущества', PRICING: '💰 Тарифы',
  CONTACTS: '📧 Контакты', PRODUCT_GRID: '🛒 Товары', MUSIC_PLAYER: '🎵 Плеер',
  SCHEDULE: '📅 Расписание', TESTIMONIALS: '💬 Отзывы', FAQ: '❓ FAQ',
  LEAD_FORM: '📝 Форма захвата', ARTISTS: '🎤 Артисты', RELEASES: '💿 Релизы',
  TRAINERS: '👥 Тренеры', MEMBERSHIPS: '🎫 Абонементы', ARTIST_CABINET: '🔑 Личный кабинет',
};

function SortableBlock({
  block,
  onDelete,
  onToggleVisibility,
}: {
  block: Block;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
}) {
  const { selectedBlockId, setSelectedBlock } = useBuilderStore();
  const isSelected = selectedBlockId === block.id;
  const color = BLOCK_COLORS[block.type] || '#7C3AED';

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const content = (() => {
    try { return JSON.parse(block.content); } catch { return {}; }
  })();

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: block.visible ? 1 : 0.4, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        onClick={() => setSelectedBlock(isSelected ? null : block.id)}
        sx={{
          mb: 2, overflow: 'hidden', cursor: 'pointer',
          border: '2px solid',
          borderColor: isSelected ? color : 'transparent',
          boxShadow: isSelected ? `0 0 0 1px ${color}44, 0 8px 32px ${color}22` : 'none',
          transition: 'all 0.2s',
          '&:hover': { borderColor: color + '66' },
          position: 'relative',
        }}
      >
        {/* Block type indicator */}
        <Box sx={{ height: 3, bgcolor: color }} />

        {/* Controls bar */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 2, py: 1,
            bgcolor: isSelected ? color + '15' : 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box {...attributes} {...listeners} sx={{ cursor: 'grab', color: 'text.secondary', display: 'flex', '&:active': { cursor: 'grabbing' } }}>
              <DragIndicator fontSize="small" />
            </Box>
            <Chip
              label={BLOCK_LABELS[block.type] || block.type}
              size="small"
              sx={{ height: 22, fontSize: 11, bgcolor: color + '20', color: color, fontWeight: 600 }}
            />
            <Typography variant="caption" color="text.secondary">#{block.position}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title={block.visible ? 'Скрыть' : 'Показать'}>
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onToggleVisibility(block.id, !block.visible); }}>
                {block.visible ? <Visibility sx={{ fontSize: 16 }} /> : <VisibilityOff sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить">
              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Block preview */}
        <Box sx={{ p: 3, minHeight: 80, bgcolor: (() => { try { return JSON.parse(block.styles).backgroundColor; } catch { return undefined; } })() }}>
          {block.type === 'HERO' && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" fontWeight={800} gutterBottom
                sx={{ color: (() => { try { return JSON.parse(block.styles).color; } catch { return undefined; } })() }}>
                {content.title || 'Заголовок Hero'}
              </Typography>
              <Typography variant="body2" color="text.secondary">{content.subtitle || 'Подзаголовок'}</Typography>
              {content.ctaText && (
                <Box sx={{ mt: 1.5, display: 'inline-block', px: 3, py: 0.8, bgcolor: color, borderRadius: 2, fontSize: 13, fontWeight: 700 }}>
                  {content.ctaText}
                </Box>
              )}
            </Box>
          )}
          {block.type === 'FEATURES' && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>{content.title || 'Преимущества'}</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {(content.items || []).slice(0, 3).map((item: { icon: string; title: string }, i: number) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography>{item.icon}</Typography>
                    <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          {['PRICING', 'CONTACTS', 'PRODUCT_GRID', 'MUSIC_PLAYER', 'SCHEDULE',
            'TESTIMONIALS', 'FAQ', 'LEAD_FORM', 'ARTISTS', 'RELEASES', 'TRAINERS', 'MEMBERSHIPS', 'ARTIST_CABINET'].includes(block.type) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {content.title || BLOCK_LABELS[block.type]} — нажмите для редактирования
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
}

interface CanvasProps {
  blocks: Block[];
  onDeleteBlock: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  previewMode: boolean;
}

export default function Canvas({ blocks, onDeleteBlock, onToggleVisibility, previewMode }: CanvasProps) {
  const { isOver, setNodeRef } = useDroppable({ id: 'canvas-drop' });

  if (previewMode) {
    return (
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#fff' }}>
        <Box sx={{ textAlign: 'center', py: 2, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="caption" color="text.secondary">Превью сайта</Typography>
        </Box>
        {blocks.filter((b) => b.visible).map((block) => {
          const s = (() => { try { return JSON.parse(block.styles); } catch { return {}; } })();
          const c = (() => { try { return JSON.parse(block.content); } catch { return {}; } })();
          return (
            <Box key={block.id} sx={{ ...s, p: s.padding || '40px 20px' }}>
              {block.type === 'HERO' && (
                <Box sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #7C3AED, #4F46E5)', py: 10, borderRadius: 2 }}>
                  <Typography variant="h3" fontWeight={800} color="white" gutterBottom>{c.title}</Typography>
                  <Typography color="rgba(255,255,255,0.8)" gutterBottom>{c.subtitle}</Typography>
                  {c.ctaText && (
                    <Box sx={{ mt: 3, display: 'inline-block', px: 4, py: 1.5, bgcolor: 'white', borderRadius: 2, fontWeight: 700, color: '#7C3AED' }}>
                      {c.ctaText}
                    </Box>
                  )}
                </Box>
              )}
              {block.type !== 'HERO' && (
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>{c.title || BLOCK_LABELS[block.type]}</Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: 1, overflowY: 'auto', p: 3,
        bgcolor: isOver ? 'rgba(124,58,237,0.04)' : 'transparent',
        transition: 'background-color 0.2s',
        position: 'relative',
      }}
    >
      <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence>
          {blocks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box
                sx={{
                  border: '2px dashed rgba(124,58,237,0.3)', borderRadius: 3,
                  p: 8, textAlign: 'center', mt: 4,
                  bgcolor: isOver ? 'rgba(124,58,237,0.06)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Typography sx={{ fontSize: 48, mb: 2 }}>📦</Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>Холст пустой</Typography>
                <Typography variant="body2" color="text.secondary">
                  Перетащите блок из левой панели или используйте кнопку добавления
                </Typography>
              </Box>
            </motion.div>
          ) : (
            blocks.map((block) => (
              <SortableBlock
                key={block.id}
                block={block}
                onDelete={onDeleteBlock}
                onToggleVisibility={onToggleVisibility}
              />
            ))
          )}
        </AnimatePresence>
      </SortableContext>
    </Box>
  );
}
