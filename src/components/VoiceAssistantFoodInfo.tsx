"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { menuItems, categoryLabels } from '@/data/menu';

function buildFoodInfoContext(): string {
  const lines = menuItems.map(item => {
    const allergens = item.allergens.length > 0 ? item.allergens.join(', ') : 'нет';
    return `- ${item.name} (id:${item.id}): ${item.description}. Аллергены: ${allergens}. Категория: ${categoryLabels[item.category]}.`;
  }).join('\n');

  return `Справочник меню ресторана SmartMenu:\n${lines}`;
}

const END_PHRASES = ['нет', 'не надо', 'всё', 'все', 'спасибо', 'понятно', 'хватит', 'до свидания', 'досвидания', 'пока'];

interface Props {
  open: boolean;
  onClose: () => void;
}

const VoiceAssistantFoodInfo: React.FC<Props> = ({ open, onClose }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentText, setAgentText] = useState('');
  const [error, setError] = useState('');
  const contextSent = useRef(false);
  const conversationRef = useRef<any>(null);

  const handleClose = useCallback(() => {
    try { conversationRef.current?.endSession(); } catch {}
    setTranscript('');
    setAgentText('');
    setError('');
    contextSent.current = false;
    onClose();
  }, [onClose]);

  const checkEndPhrase = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    if (END_PHRASES.some(p => lower === p || lower.startsWith(p))) {
      setTimeout(() => handleClose(), 600);
    }
  }, [handleClose]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[EL-FoodInfo] Connected');
      setError('');
      if (!contextSent.current) {
        try {
          conversation.sendContextualUpdate(buildFoodInfoContext());
          contextSent.current = true;
        } catch (e) {
          console.error('[EL-FoodInfo] Context send failed:', e);
        }
      }
    },
    onDisconnect: () => {
      console.log('[EL-FoodInfo] Disconnected');
      contextSent.current = false;
    },
    onError: (err) => {
      console.error('[EL-FoodInfo] Error:', err);
      const msg = typeof err === 'string' ? err : (err as any)?.message || String(err);
      setError(msg);
    },
    onMessage: (message: any) => {
      if (message.type === 'user_transcript') {
        const text = message.user_transcription_event?.user_transcript || '';
        if (text) {
          setTranscript(text);
          checkEndPhrase(text);
        }
      }
      if (message.type === 'agent_response') {
        const response = message.agent_response_event?.agent_response || '';
        if (response) setAgentText(response);
      }
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

      if (!data?.signed_url) {
        throw new Error(data?.error || 'No signed_url received');
      }

      await conversation.startSession({ signedUrl: data.signed_url } as any);
      try { conversation.setVolume({ volume: 1 }); } catch {}
    } catch (e: any) {
      console.error('[EL-FoodInfo] Start error:', e);
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-card rounded-2xl p-6 w-full max-w-md relative"
        >
          <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>

          <h3 className="font-display text-lg font-semibold mb-1">❓ Состав и приготовление</h3>
          <p className="text-sm text-muted-foreground mb-4">Спросите голосом про любое блюдо из меню</p>

          {error && <p className="text-sm text-destructive mb-3 bg-destructive/10 p-2 rounded-lg">{error}</p>}

          {isActive && (
            <div className="space-y-3 mb-4">
              <div className={`flex items-center gap-2 text-sm ${isSpeaking ? 'text-primary' : 'text-green-600'}`}>
                {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4 animate-pulse" />}
                <span className="font-medium">{isSpeaking ? '🔊 Агент говорит' : '🎤 Говорите...'}</span>
              </div>
              {transcript && (
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Вы спросили:</p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
              {agentText && (
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-xs text-primary mb-1">Ответ:</p>
                  <p className="text-sm">{agentText}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={isActive ? stop : start}
            disabled={isConnecting}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
              isActive
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'gradient-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/20'
            } disabled:opacity-50`}
          >
            {isActive ? <><MicOff className="w-4 h-4" /> Завершить</> : <><Mic className="w-4 h-4" /> {isConnecting ? 'Подключение...' : 'Начать разговор'}</>}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceAssistantFoodInfo;
