"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, Bug } from 'lucide-react';
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

  return `Ты — голосовой помощник ресторана Aurora Lounge в Алматы. Помогаешь гостям подобрать заказ по бюджету и предпочтениям.

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
  token: 'pending' | 'OK' | 'FAIL';
  micPermission: 'pending' | 'granted' | 'denied';
  session: 'idle' | 'starting' | 'started' | 'failed';
  audioWarning: string;
  lastError: string;
  lastEventType: string;
  audioTracksCount: number;
  messageCount: number;
  audioEventCount: number;
  isSpeaking: boolean;
  lastRawMessage: string;
  greetingSent: boolean;
}

const VoiceAssistant: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentText, setAgentText] = useState('');
  const [error, setError] = useState('');
  const [pickerPayload, setPickerPayload] = useState<MenuPickerPayload | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const contextSent = useRef(false);
  const greetingSentRef = useRef(false);
  const conversationRef = useRef<any>(null);

  const [debug, setDebug] = useState<DebugInfo>({
    token: 'pending',
    micPermission: 'pending',
    session: 'idle',
    audioWarning: '',
    lastError: '',
    lastEventType: '',
    audioTracksCount: 0,
    messageCount: 0,
    audioEventCount: 0,
    isSpeaking: false,
    lastRawMessage: '',
    greetingSent: false,
  });

  const updateDebug = useCallback((partial: Partial<DebugInfo>) => {
    setDebug(prev => ({ ...prev, ...partial }));
  }, []);

  const processAgentResponse = useCallback((text: string) => {
    if (!text) return;
    setAgentText(text);
    const action = extractUIAction(text);
    if (action && action.action === 'OPEN_MENU_PICKER') {
      const variants = (action.variants || []).map((v: any) => ({
        name: v.name || v.key || 'Вариант',
        items: (v.items || []).map((it: any) => ({
          id: it.id || it.name,
          name: it.name || it.id,
          price: it.price ?? it.priceKZT ?? it.totalKZT ?? 0,
        })),
        total: v.total ?? v.totalKZT ?? (v.items || []).reduce((s: number, it: any) => s + (it.price ?? it.priceKZT ?? 0), 0),
      }));
      setPickerPayload({
        title: action.title || 'Подобранное меню',
        variants,
      });
      // Auto-end conversation after menu is ready
      setTimeout(() => {
        try { conversationRef.current?.endSession(); } catch {}
      }, 500);
    }
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[EL] Connected (WebSocket)');
      setError('');
      updateDebug({ session: 'started', lastEventType: 'onConnect' });

      // Send context + greeting once connected
      if (!contextSent.current) {
        try {
          conversation.sendContextualUpdate(buildMenuContext());
          contextSent.current = true;
          console.log('[EL] Menu context sent');
        } catch (e) {
          console.error('[EL] Context send failed:', e);
        }
      }
      if (!greetingSentRef.current) {
        setTimeout(() => {
          try {
            conversation.sendUserMessage('Привет');
            greetingSentRef.current = true;
            updateDebug({ greetingSent: true });
            console.log('[EL] Greeting sent');
          } catch (e) {
            console.error('[EL] Greeting send failed:', e);
          }
        }, 500);
      }
    },
    onDisconnect: () => {
      console.log('[EL] Disconnected');
      contextSent.current = false;
      greetingSentRef.current = false;
      updateDebug({ session: 'idle', isSpeaking: false, greetingSent: false, lastEventType: 'onDisconnect' });
    },
    onError: (err) => {
      console.error('[EL] Error:', err);
      const msg = typeof err === 'string' ? err : (err as any)?.message || String(err);
      setError(msg);
      updateDebug({ lastError: msg, lastEventType: 'onError' });
    },
    onMessage: (message: any) => {
      console.log('[EL] Message RAW:', JSON.stringify(message).slice(0, 500));
      setDebug(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1,
        lastRawMessage: JSON.stringify(message).slice(0, 200),
        lastEventType: `msg:${message.type || 'unknown'}`,
      }));

      if (message.type === 'user_transcript') {
        const text = message.user_transcription_event?.user_transcript || '';
        if (text) setTranscript(text);
      }
      if (message.type === 'agent_response') {
        const response = message.agent_response_event?.agent_response || '';
        processAgentResponse(response);
      }

      // Fallback text extraction for other message shapes
      const fallbackText = message?.message ?? message?.text ?? message?.transcript ??
        message?.data?.text ?? message?.content?.[0]?.text ?? '';
      if (fallbackText && message.type !== 'user_transcript' && message.type !== 'agent_response') {
        console.log('[EL] Fallback text:', fallbackText);
        processAgentResponse(fallbackText);
      }
    },
    onAudio: ((audio: any) => {
      console.log('[EL] onAudio event');
      setDebug(prev => ({ ...prev, audioEventCount: prev.audioEventCount + 1, lastEventType: 'onAudio' }));
    }) as any,
    onModeChange: ((mode: any) => {
      console.log('[EL] ModeChange:', mode);
      const modeStr = typeof mode === 'object' ? JSON.stringify(mode) : String(mode);
      const speaking = mode?.mode === 'speaking' || mode === 'speaking';
      updateDebug({ isSpeaking: speaking, lastEventType: `mode:${modeStr}` });
    }) as any,
    onStatusChange: ((status: any) => {
      console.log('[EL] StatusChange:', status);
      updateDebug({ lastEventType: `status:${typeof status === 'object' ? JSON.stringify(status) : status}` });
    }) as any,
    onVadScore: ((score: any) => {
      updateDebug({ lastEventType: `vad:${typeof score === 'number' ? score.toFixed(2) : score}` });
    }) as any,
    onDebug: ((data: any) => {
      console.log('[EL] onDebug:', data);
      updateDebug({ lastEventType: `debug:${typeof data === 'object' ? JSON.stringify(data).slice(0, 80) : data}` });
    }) as any,
  });
  conversationRef.current = conversation;

  const start = useCallback(async () => {
    setIsConnecting(true);
    setError('');
    contextSent.current = false;
    greetingSentRef.current = false;
    updateDebug({
      session: 'starting', lastError: '', token: 'pending',
      micPermission: 'pending', messageCount: 0, audioEventCount: 0,
      isSpeaking: false, lastEventType: '', lastRawMessage: '',
      greetingSent: false, audioWarning: '',
    });

    try {
      // 1. Mic permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateDebug({ micPermission: 'granted', audioTracksCount: stream.getAudioTracks().length });
        stream.getTracks().forEach(t => t.stop());
      } catch (micErr: any) {
        updateDebug({ micPermission: 'denied', lastError: micErr.message });
        throw new Error('Микрофон не доступен: ' + micErr.message);
      }

      // 2. Get signedUrl from edge function
      console.log('[EL] Fetching signed URL...');
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-signed-url');
      console.log('[EL] Signed URL response:', data, fnError);

      if (fnError || !data?.signed_url) {
        updateDebug({ token: 'FAIL', lastError: fnError?.message || 'No signed_url' });
        throw new Error(fnError?.message || 'No signed_url received');
      }
      updateDebug({ token: 'OK' });

      // 3. Start session with signedUrl (WebSocket only)
      await conversation.startSession({
        signedUrl: data.signed_url,
      } as any);

      // 4. Set volume
      try {
        conversation.setVolume({ volume: 1 });
        console.log('[EL] Volume set to 1');
      } catch (e) {
        console.warn('[EL] setVolume failed:', e);
      }

      // 5. Audio watchdog — warn if text-only after 8s
      setTimeout(() => {
        setDebug(prev => {
          if (prev.audioEventCount === 0 && prev.messageCount > 0) {
            console.warn('[EL] Text-only detected');
            return { ...prev, audioWarning: 'AUDIO_DISABLED_OR_TEXT_ONLY' };
          }
          return prev;
        });
      }, 8000);

    } catch (e: any) {
      console.error('[EL] Start error:', e);
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
  const isSpeaking = conversation.isSpeaking;

  const statusDisplay = () => {
    if (isConnecting) return { text: 'Подключение...', color: 'text-yellow-600' };
    if (!isActive) return null;
    if (isSpeaking) return { text: '🔊 Агент говорит', color: 'text-primary' };
    return { text: '🎤 Говорите...', color: 'text-green-600' };
  };
  const status = statusDisplay();

  return (
    <>
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">🎙 Голосом</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDebug(!showDebug)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground" title="Debug">
              <Bug className="w-4 h-4" />
            </button>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'}`}>
              {isConnecting ? 'Подключение...' : isActive ? 'Подключён' : 'Отключён'}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive mb-3 bg-destructive/10 p-2 rounded-lg">{error}</p>}

        {/* Debug Panel */}
        <AnimatePresence>
          {showDebug && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-secondary/50 rounded-xl p-3 text-xs font-mono space-y-1 border border-border/50">
              <p className="font-semibold text-muted-foreground mb-1">🔧 Debug Panel</p>
              <p>mode: <span className="text-primary">WebSocket (signedUrl)</span></p>
              <p>signedUrl: <span className={debug.token === 'OK' ? 'text-green-600' : debug.token === 'FAIL' ? 'text-destructive' : 'text-muted-foreground'}>{debug.token}</span></p>
              <p>micPermission: <span className={debug.micPermission === 'granted' ? 'text-green-600' : debug.micPermission === 'denied' ? 'text-destructive' : 'text-muted-foreground'}>{debug.micPermission}</span></p>
              <p>audioTracks: {debug.audioTracksCount}</p>
              <p>session: <span className={debug.session === 'started' ? 'text-green-600' : debug.session === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>{debug.session}</span></p>
              <p>status (SDK): {conversation.status}</p>
              <p>isSpeaking: <span className={isSpeaking ? 'text-green-600 font-bold' : ''}>{String(isSpeaking)}</span></p>
              <p>greetingSent: <span className={debug.greetingSent ? 'text-green-600' : 'text-muted-foreground'}>{String(debug.greetingSent)}</span></p>
              <p>lastEventType: <span className="text-primary">{debug.lastEventType || '—'}</span></p>
              <p>messageCount: {debug.messageCount} | audioEvents: {debug.audioEventCount}</p>
              {debug.lastRawMessage && <p className="break-all">lastRaw: <span className="text-muted-foreground">{debug.lastRawMessage}</span></p>}
              {debug.lastError && <p>lastError: <span className="text-destructive">{debug.lastError}</span></p>}
              {debug.audioWarning && <p className="text-yellow-600 font-bold">⚠️ {debug.audioWarning}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio disabled warning */}
        {debug.audioWarning && isActive && (
          <p className="text-sm text-yellow-700 mb-3 bg-yellow-100 p-2 rounded-lg">
            ⚠️ Аудио отключено. Проверьте chat/text-only режим агента в ElevenLabs dashboard.
          </p>
        )}

        {/* Status indicator */}
        {isActive && status && (
          <div className={`flex items-center gap-2 text-sm mb-3 ${status.color}`}>
            {isSpeaking ? <Volume2 className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4 animate-pulse" />}
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

      <MenuPickerModal
        payload={pickerPayload}
        onClose={() => setPickerPayload(null)}
      />
    </>
  );
};

export default VoiceAssistant;
