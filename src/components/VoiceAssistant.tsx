"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, Loader2, Bug } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { extractUIAction } from '@/lib/uiAction';
import MenuPickerModal, { MenuPickerPayload } from '@/components/MenuPickerModal';
import { menuItems, categoryLabels } from '@/data/menu';

function buildMenuContext(): string {
  const grouped: Record<string, string[]> = {};
  menuItems.forEach(item => {
    const cat = categoryLabels[item.category] || item.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(`${item.name} (id:${item.id}, ${item.priceKZT}₸)`);
  });
  const lines = Object.entries(grouped).map(([cat, items]) => `${cat}: ${items.join(', ')}`).join('\n');

  return `Ты — голосовой помощник ресторана SmartMenu в Алматы. Помогаешь гостям подобрать заказ по бюджету и предпочтениям.

МЕНЮ РЕСТОРАНА:
${lines}

ВАЖНО: Когда пользователь просит подобрать меню (указывает бюджет, количество людей, предпочтения), ты ДОЛЖЕН в своём ответе включить блок:

<UI_ACTION>
{
  "action": "OPEN_MENU_PICKER",
  "title": "Подбор меню на [бюджет] для [кол-во] человек",
  "variants": [
    {
      "name": "Вариант A — Сбалансированный",
      "items": [{"id": "h1", "name": "Классический кальян", "price": 7000}, ...],
      "total": 25000
    },
    {
      "name": "Вариант B — Сытный",
      "items": [...],
      "total": 28000
    },
    {
      "name": "Вариант C — Лёгкий",
      "items": [...],
      "total": 22000
    }
  ]
}
</UI_ACTION>

Правила подбора:
- Создавай ровно 3 варианта (Сбалансированный, Сытный, Лёгкий)
- Итого каждого варианта должно быть 80-100% от бюджета
- Используй ТОЛЬКО id из меню выше
- Учитывай пожелания (халяль, без алкоголя, веган и т.д.)
- Отвечай на русском языке
- Блок <UI_ACTION> автоматически откроет модалку выбора на экране пользователя`;
}

interface DebugInfo {
  signedUrl: 'pending' | 'OK' | 'FAIL';
  token: 'pending' | 'OK' | 'FAIL';
  micPermission: 'pending' | 'granted' | 'denied';
  connectionType: string;
  session: 'idle' | 'starting' | 'started' | 'failed';
  lastError: string;
  lastEventType: string;
  audioTracksCount: number;
}

const VoiceAssistant: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentText, setAgentText] = useState('');
  const [error, setError] = useState('');
  const [pickerPayload, setPickerPayload] = useState<MenuPickerPayload | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const contextSent = useRef(false);

  const [debug, setDebug] = useState<DebugInfo>({
    signedUrl: 'pending',
    token: 'pending',
    micPermission: 'pending',
    connectionType: 'webrtc',
    session: 'idle',
    lastError: '',
    lastEventType: '',
    audioTracksCount: 0,
  });

  const updateDebug = useCallback((partial: Partial<DebugInfo>) => {
    setDebug(prev => ({ ...prev, ...partial }));
  }, []);

  const processAgentResponse = useCallback((text: string) => {
    setAgentText(text);
    const action = extractUIAction(text);
    if (action && action.action === 'OPEN_MENU_PICKER') {
      setPickerPayload({
        title: action.title || 'Подобранное меню',
        variants: action.variants || [],
      });
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[ElevenLabs] Connected');
      setError('');
      updateDebug({ session: 'started', lastEventType: 'connected' });
    },
    onDisconnect: () => {
      console.log('[ElevenLabs] Disconnected');
      contextSent.current = false;
      updateDebug({ session: 'idle', lastEventType: 'disconnected' });
    },
    onError: (err) => {
      console.error('[ElevenLabs] Error:', err);
      const msg = typeof err === 'string' ? err : (err as any)?.message || String(err);
      setError(msg);
      updateDebug({ lastError: msg, lastEventType: 'error' });
    },
    onMessage: (message: any) => {
      console.log('[ElevenLabs] Message:', message.type, message);
      updateDebug({ lastEventType: message.type });

      if (message.type === 'user_transcript') {
        const text = message.user_transcription_event?.user_transcript || '';
        setTranscript(text);
      }
      if (message.type === 'agent_response') {
        const response = message.agent_response_event?.agent_response || '';
        processAgentResponse(response);
      }
    },
  });

  const start = useCallback(async () => {
    setIsConnecting(true);
    setError('');
    updateDebug({ session: 'starting', lastError: '', signedUrl: 'pending', token: 'pending', micPermission: 'pending' });

    try {
      // 1. Request microphone
      console.log('[ElevenLabs] Requesting microphone...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateDebug({ micPermission: 'granted', audioTracksCount: stream.getAudioTracks().length });
        console.log('[ElevenLabs] Mic granted, tracks:', stream.getAudioTracks().length);
        // Stop tracks - the SDK will request its own
        stream.getTracks().forEach(t => t.stop());
      } catch (micErr: any) {
        updateDebug({ micPermission: 'denied', lastError: micErr.message });
        throw new Error('Микрофон не доступен: ' + micErr.message);
      }

      // 2. Get credentials from edge function
      console.log('[ElevenLabs] Fetching credentials...');
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-signed-url');
      console.log('[ElevenLabs] Credentials response:', data, fnError);

      if (fnError || !data) {
        updateDebug({ signedUrl: 'FAIL', token: 'FAIL', lastError: fnError?.message || 'No data' });
        throw new Error(fnError?.message || 'Не удалось получить credentials');
      }

      const hasToken = !!data.token;
      const hasSignedUrl = !!data.signed_url;
      updateDebug({
        token: hasToken ? 'OK' : 'FAIL',
        signedUrl: hasSignedUrl ? 'OK' : 'FAIL',
      });

      // 3. Start session - prefer WebRTC (token), fallback to WebSocket (signed_url)
      if (hasToken) {
        console.log('[ElevenLabs] Starting WebRTC session with token...');
        updateDebug({ connectionType: 'webrtc' });
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: 'webrtc',
        } as any);
      } else if (hasSignedUrl) {
        console.log('[ElevenLabs] Falling back to WebSocket with signed_url...');
        updateDebug({ connectionType: 'websocket' });
        await conversation.startSession({
          signedUrl: data.signed_url,
        });
      } else {
        throw new Error('Нет ни token, ни signed_url в ответе');
      }

      // 4. Send menu context
      if (!contextSent.current) {
        setTimeout(() => {
          try {
            conversation.sendContextualUpdate(buildMenuContext());
            contextSent.current = true;
            console.log('[ElevenLabs] Menu context sent');
          } catch (e) {
            console.error('[ElevenLabs] Failed to send context:', e);
          }
        }, 1000);
      }
    } catch (e: any) {
      console.error('[ElevenLabs] Start error:', e);
      setError(e.message || 'Ошибка подключения');
      updateDebug({ session: 'failed', lastError: e.message || 'Unknown' });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, updateDebug]);

  const stop = useCallback(async () => {
    await conversation.endSession();
    setTranscript('');
    setAgentText('');
  }, [conversation]);

  const isActive = conversation.status === 'connected';

  const statusDisplay = () => {
    if (isConnecting) return { text: 'Подключение...', color: 'text-yellow-600' };
    if (!isActive) return null;
    if (conversation.isSpeaking) return { text: '🔊 Speaking — агент говорит', color: 'text-primary' };
    return { text: '🎤 Listening — говорите...', color: 'text-green-600' };
  };

  const status = statusDisplay();

  return (
    <>
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">🎙 Голосом</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
              title="Debug панель"
            >
              <Bug className="w-4 h-4" />
            </button>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'
            }`}>
              {isConnecting ? 'Подключение...' : isActive ? 'Подключён' : 'Отключён'}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mb-3 bg-destructive/10 p-2 rounded-lg">{error}</p>}

        {/* Debug Panel */}
        <AnimatePresence>
          {showDebug && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-secondary/50 rounded-xl p-3 text-xs font-mono space-y-1 border border-border/50"
            >
              <p className="font-semibold text-muted-foreground mb-1">🔧 Debug Panel</p>
              <p>token: <span className={debug.token === 'OK' ? 'text-green-600' : debug.token === 'FAIL' ? 'text-destructive' : 'text-muted-foreground'}>{debug.token}</span></p>
              <p>signedUrl: <span className={debug.signedUrl === 'OK' ? 'text-green-600' : debug.signedUrl === 'FAIL' ? 'text-destructive' : 'text-muted-foreground'}>{debug.signedUrl}</span></p>
              <p>connectionType: <span className="text-primary">{debug.connectionType}</span></p>
              <p>micPermission: <span className={debug.micPermission === 'granted' ? 'text-green-600' : debug.micPermission === 'denied' ? 'text-destructive' : 'text-muted-foreground'}>{debug.micPermission}</span></p>
              <p>audioTracksCount: {debug.audioTracksCount}</p>
              <p>session: <span className={debug.session === 'started' ? 'text-green-600' : debug.session === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>{debug.session}</span></p>
              <p>status (SDK): {conversation.status}</p>
              <p>isSpeaking: {String(conversation.isSpeaking)}</p>
              <p>lastEventType: {debug.lastEventType || '—'}</p>
              {debug.lastError && <p>lastError: <span className="text-destructive">{debug.lastError}</span></p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status indicator */}
        {isActive && status && (
          <div className={`flex items-center gap-2 text-sm mb-3 ${status.color}`}>
            {conversation.isSpeaking
              ? <Volume2 className="w-4 h-4 animate-pulse" />
              : <Mic className="w-4 h-4 animate-pulse" />
            }
            <span className="font-medium">{status.text}</span>
          </div>
        )}

        {/* Transcripts */}
        {isActive && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 mb-4">
              {transcript && (
                <div className="bg-secondary rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Вы сказали:</p>
                  <p className="text-sm">{transcript}</p>
                </div>
              )}
              {agentText && (
                <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                  <p className="text-xs text-primary mb-1">Ассистент:</p>
                  <p className="text-sm">{agentText.replace(/<UI_ACTION>[\s\S]*?<\/UI_ACTION>/g, '').trim()}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
          {isActive ? <><MicOff className="w-4 h-4" /> Стоп</> : <><Mic className="w-4 h-4" /> {isConnecting ? 'Подключение...' : 'Начать разговор'}</>}
        </button>
      </div>

      <MenuPickerModal payload={pickerPayload} onClose={() => setPickerPayload(null)} />
    </>
  );
};

export default VoiceAssistant;
