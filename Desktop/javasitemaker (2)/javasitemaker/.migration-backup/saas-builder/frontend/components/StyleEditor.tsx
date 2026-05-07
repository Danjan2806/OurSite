'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Divider, IconButton,
  Accordion, AccordionSummary, AccordionDetails, Tooltip,
  Switch, FormControlLabel, Button,
} from '@mui/material';
import { ExpandMore, Delete, Visibility, VisibilityOff, Refresh } from '@mui/icons-material';
import { useBuilderStore } from '@/lib/store';

const COLORS = ['#7C3AED', '#4F46E5', '#059669', '#DC2626', '#D97706', '#0284C7', '#DB2777', '#ffffff', '#000000'];

interface StyleEditorProps {
  selectedBlock: { id: string; type: string; content: string; styles: string; visible: boolean } | null;
  globalStyles: string;
  onUpdateBlock: (id: string, data: { content?: string; styles?: string; visible?: boolean }) => void;
  onUpdateGlobalStyles: (styles: string) => void;
  onDeleteBlock: (id: string) => void;
}

export default function StyleEditor({ selectedBlock, globalStyles, onUpdateBlock, onUpdateGlobalStyles, onDeleteBlock }: StyleEditorProps) {
  const { setSelectedBlock } = useBuilderStore();
  const [blockContent, setBlockContent] = useState('');
  const [blockStyles, setBlockStyles] = useState('');
  const [globalStylesState, setGlobalStylesState] = useState('');
  const [contentError, setContentError] = useState('');
  const [stylesError, setStylesError] = useState('');

  useEffect(() => {
    if (selectedBlock) {
      setBlockContent(selectedBlock.content);
      setBlockStyles(selectedBlock.styles);
      setContentError('');
      setStylesError('');
    }
  }, [selectedBlock?.id]);

  useEffect(() => {
    try {
      setGlobalStylesState(JSON.stringify(JSON.parse(globalStyles), null, 2));
    } catch {
      setGlobalStylesState(globalStyles || '{}');
    }
  }, [globalStyles]);

  const handleUpdateContent = () => {
    if (!selectedBlock) return;
    try {
      JSON.parse(blockContent);
      onUpdateBlock(selectedBlock.id, { content: blockContent });
      setContentError('');
    } catch {
      setContentError('Некорректный JSON');
    }
  };

  const handleUpdateStyles = () => {
    if (!selectedBlock) return;
    try {
      JSON.parse(blockStyles);
      onUpdateBlock(selectedBlock.id, { styles: blockStyles });
      setStylesError('');
    } catch {
      setStylesError('Некорректный JSON');
    }
  };

  const handleGlobalStylesUpdate = () => {
    try {
      JSON.parse(globalStylesState);
      onUpdateGlobalStyles(globalStylesState);
    } catch { /* invalid JSON, ignore */ }
  };

  const parseStyles = (stylesStr: string) => {
    try { return JSON.parse(stylesStr); } catch { return {}; }
  };

  const updateStyleProp = (key: string, value: string) => {
    if (!selectedBlock) return;
    const current = parseStyles(blockStyles);
    const updated = JSON.stringify({ ...current, [key]: value });
    setBlockStyles(updated);
    onUpdateBlock(selectedBlock.id, { styles: updated });
  };

  return (
    <Box
      sx={{
        width: 280, flexShrink: 0,
        bgcolor: 'background.paper',
        borderLeft: '1px solid',
        borderColor: 'divider',
        overflowY: 'auto',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {!selectedBlock ? (
        <Box>
          {/* Global styles panel */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>
              Стили сайта
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Цветовая схема
            </Typography>
            {['primaryColor', 'secondaryColor', 'backgroundColor', 'textColor'].map((key) => {
              const parsed = parseStyles(globalStyles);
              return (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <input
                    type="color"
                    value={parsed[key] || '#000000'}
                    onChange={(e) => {
                      const updated = { ...parsed, [key]: e.target.value };
                      setGlobalStylesState(JSON.stringify(updated, null, 2));
                      onUpdateGlobalStyles(JSON.stringify(updated));
                    }}
                    style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'none' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {key === 'primaryColor' ? 'Основной' : key === 'secondaryColor' ? 'Акцент' : key === 'backgroundColor' ? 'Фон' : 'Текст'}
                  </Typography>
                </Box>
              );
            })}

            <Divider sx={{ my: 2 }} />

            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>JSON стилей</Typography>
            <TextField
              multiline rows={8} fullWidth
              value={globalStylesState}
              onChange={(e) => setGlobalStylesState(e.target.value)}
              onBlur={handleGlobalStylesUpdate}
              size="small"
              sx={{ fontFamily: 'monospace', '& textarea': { fontSize: 12, fontFamily: 'monospace' } }}
            />
          </Box>
        </Box>
      ) : (
        <Box>
          {/* Block editor header */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>
                Блок
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>{selectedBlock.type}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title={selectedBlock.visible ? 'Скрыть' : 'Показать'}>
                <IconButton size="small" onClick={() => onUpdateBlock(selectedBlock.id, { visible: !selectedBlock.visible })}>
                  {selectedBlock.visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Tooltip title="Удалить блок">
                <IconButton size="small" color="error" onClick={() => { onDeleteBlock(selectedBlock.id); setSelectedBlock(null); }}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Visual style controls */}
          <Accordion defaultExpanded disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2, minHeight: 48 }}>
              <Typography variant="body2" fontWeight={600}>Внешний вид</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                {COLORS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => updateStyleProp('backgroundColor', color)}
                    sx={{
                      width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                      bgcolor: color, border: '2px solid rgba(255,255,255,0.1)',
                      '&:hover': { transform: 'scale(1.2)', border: '2px solid white' },
                      transition: 'all 0.15s',
                    }}
                  />
                ))}
              </Box>
              <TextField
                fullWidth label="Отступ (padding)" size="small" sx={{ mb: 1.5 }}
                value={parseStyles(blockStyles).padding || ''}
                onChange={(e) => updateStyleProp('padding', e.target.value)}
                placeholder="60px 0"
              />
              <TextField
                fullWidth label="Мин. высота" size="small"
                value={parseStyles(blockStyles).minHeight || ''}
                onChange={(e) => updateStyleProp('minHeight', e.target.value)}
                placeholder="auto"
              />
            </AccordionDetails>
          </Accordion>

          <Divider />

          {/* Content JSON */}
          <Accordion disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2, minHeight: 48 }}>
              <Typography variant="body2" fontWeight={600}>Содержимое (JSON)</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2 }}>
              <TextField
                multiline rows={8} fullWidth
                value={blockContent}
                onChange={(e) => setBlockContent(e.target.value)}
                error={!!contentError}
                helperText={contentError}
                size="small"
                sx={{ '& textarea': { fontSize: 12, fontFamily: 'monospace' } }}
              />
              <Button size="small" variant="outlined" fullWidth sx={{ mt: 1 }} onClick={handleUpdateContent}>
                Применить
              </Button>
            </AccordionDetails>
          </Accordion>

          <Divider />

          {/* Styles JSON */}
          <Accordion disableGutters sx={{ boxShadow: 'none', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2, minHeight: 48 }}>
              <Typography variant="body2" fontWeight={600}>CSS стили (JSON)</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2 }}>
              <TextField
                multiline rows={8} fullWidth
                value={blockStyles}
                onChange={(e) => setBlockStyles(e.target.value)}
                error={!!stylesError}
                helperText={stylesError}
                size="small"
                sx={{ '& textarea': { fontSize: 12, fontFamily: 'monospace' } }}
              />
              <Button size="small" variant="outlined" fullWidth sx={{ mt: 1 }} onClick={handleUpdateStyles}>
                Применить
              </Button>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </Box>
  );
}
