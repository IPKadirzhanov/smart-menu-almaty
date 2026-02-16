import React, { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { menuItems, categoryLabels } from '@/data/menu';

function buildFoodInfoContext(): string {
  const lines = menuItems.map(item => {
    const allergens = item.allergens.length > 0 ? item.allergens.join(', ') : 'нет';
    return `- ${item.name} (id:${item.id}): ${item.description}. Аллергены: ${allergens}. Категория: ${categoryLabels[item.category]}.`;
  }).join('\n');
  return `Справочник меню ресторана SmartMenu:\n${lines}`;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/[.,!?;:…—–\-"""''«»()\[\]{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const END_TRIGGERS = [
  'нет', 'не надо', 'все', 'спасибо', 'понятно', 'хватит',
  'до свидания', 'досвидания', 'ок', 'окей', 'неа', 'закончили', 'достаточно', 'пока'
];

function isEndPhrase(raw: string): boolean {
  const norm = normalizeText(raw);
  if (!norm) return false;
  return END_TRIGGERS.some(t => norm === t || norm.startsWith(t + ' ') || norm.startsWith(t + ','));
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const InlineFoodInfoPanel: React.FC<Props> = ({ open, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentText, setAgentText] = useState('');
  const [error, setError] = useState('');
  const contextSent = useRef(false);
  const conversationRef = useRef<any>(null);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    try { conversationRef.current?.endSession(); } catch {}
    setTranscript('');
    setAgentText('');
    setError('');
    contextSent.current = false;
    onCloseRef.current();
    setTimeout(() => { closingRef.current = false; }, 300);
  }, []);

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const conversation = useConversation({
    onConnect: () => {
      setError('');
      if (!contextSent.current) {
        try {
          conversation.sendContextualUpdate(buildFoodInfoContext());
          contextSent.current = true;
        } catch {}
      }
    },
    onDisconnect: () => { contextSent.current = false; },
    onError: (err) => {
      const msg = typeof err === 'string' ? err : (err as any)?.message || String(err);
      setError(msg);
    },
    onMessage: (message: any) => {
      const checkAndClose = (text: string) => {
        if (!text) return;
        setTranscript(text);
        if (isEndPhrase(text)) {
          setTimeout(() => handleCloseRef.current(), 600);
        }
      };

      if (message.type === 'user_transcript') {
        const text = message.user_transcription_event?.user_transcript || '';
        if (text) checkAndClose(text);
      }
      if (message.role === 'user' && message.message) checkAndClose(message.message);
      if (message.source === 'user' && (message.message || message.text || message.transcript)) {
        checkAndClose(message.message || message.text || message.transcript);
      }
      if (message.type === 'agent_response') {
        const response = message.agent_response_event?.agent_response || '';
        if (response) setAgentText(response);
      }
      if (message.role === 'assistant' && message.message) setAgentText(message.message);
    },
  });
  conversationRef.current = conversation;

  const start = useCallback(async () => {
    setIsConnecting(true);
    setError('');
    contextSent.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-signed-url?mode=foodinfo`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const data = await response.json();
      if (!data?.signed_url) throw new Error(data?.error || 'No signed_url received');
      await conversation.startSession({ signedUrl: data.signed_url } as any);
      try { conversation.setVolume({ volume: 1 }); } catch {}
    } catch (e: any) {
      setError(e.message || 'Ошибка подключения');
    } finally {
      setIsConnecting(false);
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setTranscript('');
    setAgentText('');
  }, [conversation]);

  const isActive = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mt-4 pt-4 border-t border-border/50"
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">❓ Состав и приготовление</h4>
          <button onClick={handleClose} className="p-1 rounded hover:bg-secondary text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Назовите блюдо — я кратко объясню состав и как готовится.</p>

        {error && <p className="text-xs text-destructive mb-2 bg-destructive/10 p-2 rounded-lg">{error}</p>}

        {isActive && (
          <div className="space-y-2 mb-3">
            <div className={`flex items-center gap-2 text-xs ${isSpeaking ? 'text-primary' : 'text-green-600'}`}>
              {isSpeaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <Mic className="w-3.5 h-3.5 animate-pulse" />}
              <span className="font-medium">{isSpeaking ? '🔊 Агент говорит' : '🎤 Говорите...'}</span>
            </div>
            {transcript && (
              <div className="bg-secondary rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Вы спросили:</p>
                <p className="text-xs">{transcript}</p>
              </div>
            )}
            {agentText && (
              <div className="bg-primary/5 rounded-lg p-2 border border-primary/10">
                <p className="text-[10px] text-primary mb-0.5">Ответ:</p>
                <p className="text-xs">{agentText}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={isActive ? stop : start}
          disabled={isConnecting}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all duration-300 ${
            isActive
              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
              : 'gradient-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20'
          } disabled:opacity-50`}
        >
          {isActive ? <><MicOff className="w-3.5 h-3.5" /> Завершить</> : <><Mic className="w-3.5 h-3.5" /> {isConnecting ? 'Подключение...' : 'Начать разговор'}</>}
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default InlineFoodInfoPanel;
