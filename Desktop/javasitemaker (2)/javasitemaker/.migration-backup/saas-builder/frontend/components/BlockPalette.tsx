'use client';

import { Box, Typography, Divider, Tooltip, Paper, Skeleton, Chip } from '@mui/material';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useAvailableBlocks } from '@/hooks/useSites';
import { motion } from 'framer-motion';
import {
  ViewDay, Star, AttachMoney, AlternateEmail, ShoppingBag,
  MusicNote, Event, Group, CardMembership, QuestionAnswer,
  Person, RateReview,
} from '@mui/icons-material';

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  HERO: <ViewDay />, FEATURES: <Star />, PRICING: <AttachMoney />,
  CONTACTS: <AlternateEmail />, PRODUCT_GRID: <ShoppingBag />,
  MUSIC_PLAYER: <MusicNote />, SCHEDULE: <Event />,
  ARTISTS: <Group />, RELEASES: <MusicNote />, TRAINERS: <Group />,
  MEMBERSHIPS: <CardMembership />, FAQ: <QuestionAnswer />,
  ARTIST_CABINET: <Person />, TESTIMONIALS: <RateReview />, LEAD_FORM: <AlternateEmail />,
  CATEGORIES: <ShoppingBag />, CART: <ShoppingBag />,
};

function DraggableBlock({ block }: { block: { type: string; label: string; icon: string } }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${block.type}`,
    data: { type: block.type, fromPalette: true },
  });

  return (
    <Paper
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1.5, mb: 1, cursor: 'grab', display: 'flex', alignItems: 'center', gap: 1.5,
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        border: '1px solid transparent',
        transition: 'all 0.15s',
        userSelect: 'none',
        '&:hover': {
          border: '1px solid rgba(124,58,237,0.4)',
          bgcolor: 'rgba(124,58,237,0.08)',
          transform: 'translateX(2px)',
        },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <Box sx={{ color: '#7C3AED', display: 'flex', flexShrink: 0, fontSize: 20 }}>
        {BLOCK_ICONS[block.type] || <ViewDay />}
      </Box>
      <Typography variant="body2" fontWeight={600} noWrap>{block.label}</Typography>
    </Paper>
  );
}

interface BlockPaletteProps {
  businessType: string;
}

export default function BlockPalette({ businessType }: BlockPaletteProps) {
  const { data: blocks, isLoading } = useAvailableBlocks(businessType);

  return (
    <Box
      sx={{
        width: 240, flexShrink: 0,
        bgcolor: 'background.paper',
        borderRight: '1px solid',
        borderColor: 'divider',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
          Блоки
        </Typography>
        <Chip label={businessType.replace('_', ' ')} size="small" sx={{ mt: 0.5, height: 20, fontSize: 10, bgcolor: 'rgba(124,58,237,0.15)', color: '#7C3AED' }} />
      </Box>

      <Box sx={{ p: 1.5, overflowY: 'auto', flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 0.5, mb: 1, display: 'block' }}>
          Перетащите на холст
        </Typography>

        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 2 }} />
            ))
          : blocks?.map((block: { type: string; label: string; icon: string }, i: number) => (
              <motion.div
                key={block.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Tooltip title={`Добавить: ${block.label}`} placement="right">
                  <span>
                    <DraggableBlock block={block} />
                  </span>
                </Tooltip>
              </motion.div>
            ))
        }
      </Box>
    </Box>
  );
}
