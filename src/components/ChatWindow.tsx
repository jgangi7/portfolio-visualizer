import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Fab,
  Divider,
  CircularProgress,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Anthropic from '@anthropic-ai/sdk';
import { StockPosition } from '../types/stock';
import { buildPortfolioSystemPrompt, streamChatMessage } from '../services/chatService';

interface ChatWindowProps {
  positions: StockPosition[];
}

interface DisplayMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
}

const ChatWindow = ({ positions }: ChatWindowProps) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: DisplayMessage = { id: msgId.current++, role: 'user', content: text };
    const assistantId = msgId.current++;
    const assistantMsg: DisplayMessage = { id: assistantId, role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: Anthropic.MessageParam[] = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];
      const systemPrompt = buildPortfolioSystemPrompt(positions);

      await streamChatMessage(history, systemPrompt, (delta) => {
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: m.content + delta } : m)
        );
      });
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantId
          ? { ...m, content: 'Sorry, something went wrong. Check that your VITE_ANTHROPIC_API_KEY is set.' }
          : m)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Fab
        color="primary"
        size="medium"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
        onClick={() => setOpen(o => !o)}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {open && (
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            width: { xs: 'calc(100vw - 48px)', sm: 380 },
            height: 520,
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 2,
          }}
        >
          {/* Header */}
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={700}>Portfolio Assistant</Typography>
            <Typography variant="caption" color="text.secondary">
              {positions.length > 0
                ? `${positions.length} position${positions.length !== 1 ? 's' : ''} loaded`
                : 'No positions — general finance questions only'}
            </Typography>
          </Box>

          {/* Messages */}
          <Box
            ref={scrollRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              px: 2,
              py: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 6, px: 2 }}>
                Ask about your portfolio performance, diversification, sector exposure, or general investing.
              </Typography>
            )}

            {messages.map(msg => (
              <Box
                key={msg.id}
                sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                <Box
                  sx={{
                    maxWidth: '82%',
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'action.selected',
                    color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  {msg.role === 'assistant' && msg.content === '' && loading ? (
                    <CircularProgress size={14} />
                  ) : (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {msg.content}
                    </Typography>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          <Divider />

          {/* Input */}
          <Box sx={{ px: 1.5, py: 1, display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              size="small"
              placeholder="Ask about your portfolio…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || loading}
              color="primary"
              size="small"
              sx={{ mb: 0.25 }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default ChatWindow;
