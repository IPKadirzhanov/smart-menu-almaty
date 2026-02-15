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
  connectionMode: 'agentId' | 'token-webrtc' | 'websocket' | 'none';
  token: 'pending' | 'OK' | 'FAIL' | 'skipped';
  micPermission: 'pending' | 'granted' | 'denied';
  session: 'idle' | 'starting' | 'started' | 'failed' | 'fallback-ws';
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
  const gotEventsRef = useRef(false);
  const greetingSentRef = useRef(false);
  const gotAgentTextRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentIdRef = useRef<string | null>(null);

  const [debug, setDebug] = useState<DebugInfo>({
    connectionMode: 'none',
    token: 'pending',
    micPermission: 'pending',
    session: 'idle',
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
    gotAgentTextRef.current = true;
    setAgentText(text);
    const action = extractUIAction(text);
    if (action && action.action === 'OPEN_MENU_PICKER') {
      setPickerPayload({
        title: action.title || 'Подобранное меню',
        variants: action.variants || [],
      });
    }
  }, []);

  const markEvent = useCallback((eventName: string) => {
    gotEventsRef.current = true;
    updateDebug({ lastEventType: eventName });
  }, [updateDebug]);

  const conversation = useConversation({
    onConnect: () => {
      console.log('[EL] Connected');
      setError('');
      markEvent('onConnect');
      updateDebug({ session: 'started' });
    },
    onDisconnect: () => {
      console.log('[EL] Disconnected');
      contextSent.current = false;
      greetingSentRef.current = false;
      gotAgentTextRef.current = false;
      markEvent('onDisconnect');
      updateDebug({ session: 'idle', isSpeaking: false, greetingSent: false });
    },
    onError: (err) => {
      console.error('[EL] Error:', err);
      const msg = typeof err === 'string' ? err : (err as any)?.message || String(err);
      setError(msg);
      markEvent('onError');
      updateDebug({ lastError: msg });
    },
    onMessage: (message: any) => {
      console.log('[EL] Message RAW:', JSON.stringify(message).slice(0, 500));
      markEvent(`msg:${message.type || 'unknown'}`);
      setDebug(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1,
        lastRawMessage: JSON.stringify(message).slice(0, 200),
      }));

      // Extract text from any possible shape
      if (message.type === 'user_transcript') {
        const text = message.user_transcription_event?.user_transcript || '';
        if (text) setTranscript(text);
      }
      if (message.type === 'agent_response') {
        const response = message.agent_response_event?.agent_response || '';
        processAgentResponse(response);
      }

      // Generic fallback text extraction
      const fallbackText = message?.message ?? message?.text ?? message?.transcript ?? 
        message?.data?.text ?? message?.content?.[0]?.text ?? '';
      if (fallbackText && message.type !== 'user_transcript' && message.type !== 'agent_response') {
        console.log('[EL] Fallback text extracted:', fallbackText);
        processAgentResponse(fallbackText);
      }
    },
    onModeChange: ((mode: any) => {
      console.log('[EL] ModeChange:', mode);
      markEvent(`mode:${JSON.stringify(mode)}`);
      const speaking = mode?.mode === 'speaking' || mode === 'speaking';
      updateDebug({ isSpeaking: speaking });
    }) as any,
    onStatusChange: ((status: any) => {
      console.log('[EL] StatusChange:', status);
      markEvent(`status:${JSON.stringify(status)}`);
    }) as any,
  });

  // Send greeting + context after connection
  const sendGreetingAndContext = useCallback(() => {
    if (!contextSent.current) {
      try {
        conversation.sendContextualUpdate(buildMenuContext());
        contextSent.current = true;
        console.log('[EL] Menu context sent');
      } catch (e) {
        console.error('[EL] Context send failed:', e);
      }
    }

    // Send initial message to trigger agent's first response
    if (!greetingSentRef.current) {
      try {
        setTimeout(() => {
          conversation.sendUserMessage('Привет');
          greetingSentRef.current = true;
          updateDebug({ greetingSent: true });
          console.log('[EL] Greeting "Привет" sent');

          // Start fallback timer AFTER greeting is sent
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = setTimeout(() => {
            if (!gotAgentTextRef.current) {
              console.warn('[EL] No agent response 3s after greeting, triggering WS fallback');
              startWebSocketFallback();
            }
          }, 3000);
        }, 500);
      } catch (e) {
        console.error('[EL] Greeting send failed:', e);
      }
    }
  }, [conversation, updateDebug]);

  // Fallback to websocket
  const startWebSocketFallback = useCallback(async () => {
    console.log('[EL] Fallback → websocket');
    updateDebug({ session: 'fallback-ws', connectionMode: 'websocket', lastEventType: 'fallback→ws' });
    setError('');
    contextSent.current = false;
    greetingSentRef.current = false;
    gotAgentTextRef.current = false;

    try {
      await conversation.endSession();
    } catch { /* ignore */ }

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('elevenlabs-signed-url');
      if (fnErr || !data?.signed_url) {
        throw new Error(fnErr?.message || 'No signed_url');
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
      } as any);

      setTimeout(() => sendGreetingAndContext(), 1000);
    } catch (e: any) {
      console.error('[EL] WS fallback failed:', e);
      setError('Fallback WS failed: ' + (e.message || 'Unknown'));
      updateDebug({ session: 'failed', lastError: e.message || 'Unknown' });
    }
  }, [conversation, sendGreetingAndContext, updateDebug]);

  const start = useCallback(async () => {
    setIsConnecting(true);
    setError('');
    gotEventsRef.current = false;
    gotAgentTextRef.current = false;
    greetingSentRef.current = false;
    contextSent.current = false;
    updateDebug({
      session: 'starting', lastError: '', token: 'pending',
      micPermission: 'pending', messageCount: 0, audioEventCount: 0,
      connectionMode: 'none', isSpeaking: false, lastEventType: '',
      lastRawMessage: '', greetingSent: false,
    });

    try {
      // 1. Mic
      console.log('[EL] Requesting mic...');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        updateDebug({ micPermission: 'granted', audioTracksCount: stream.getAudioTracks().length });
        stream.getTracks().forEach(t => t.stop());
      } catch (micErr: any) {
        updateDebug({ micPermission: 'denied', lastError: micErr.message });
        throw new Error('Микрофон не доступен: ' + micErr.message);
      }

      // 2. Get token + agent_id from edge function
      console.log('[EL] Fetching token + agent_id...');
      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-conversation-token');
      console.log('[EL] Token response:', data, fnError);

      const agentId = data?.agent_id;
      const token = data?.token;
      agentIdRef.current = agentId || null;

      // 3. Try agentId first (public agent), then token (private agent)
      if (agentId) {
        console.log('[EL] Trying agentId connection...');
        updateDebug({ connectionMode: 'agentId', token: token ? 'OK' : 'skipped' });
        try {
          await conversation.startSession({
            agentId,
          } as any);
          updateDebug({ lastEventType: 'startSession(agentId)' });
        } catch (agentIdErr: any) {
          console.warn('[EL] agentId failed, trying token...', agentIdErr);
          if (token) {
            updateDebug({ connectionMode: 'token-webrtc', token: 'OK' });
            await conversation.startSession({
              conversationToken: token,
            } as any);
            updateDebug({ lastEventType: 'startSession(token)' });
          } else {
            throw agentIdErr;
          }
        }
      } else if (token) {
        console.log('[EL] Using token connection...');
        updateDebug({ connectionMode: 'token-webrtc', token: 'OK' });
        await conversation.startSession({
          conversationToken: token,
        } as any);
        updateDebug({ lastEventType: 'startSession(token)' });
      } else {
        updateDebug({ token: 'FAIL', lastError: fnError?.message || 'No token/agent_id' });
        throw new Error(fnError?.message || 'No token or agent_id received');
      }

      // 4. Send context + greeting after 1s (gives onConnect time to fire)
      setTimeout(() => sendGreetingAndContext(), 1000);

    } catch (e: any) {
      console.error('[EL] Start error:', e);
      setError(e.message || 'Ошибка подключения');
      updateDebug({ session: 'failed', lastError: e.message || 'Unknown' });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, updateDebug, sendGreetingAndContext]);

  const stop = useCallback(async () => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
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
              <p>connectionMode: <span className="text-primary">{debug.connectionMode}</span></p>
              <p>token: <span className={debug.token === 'OK' ? 'text-green-600' : debug.token === 'FAIL' ? 'text-destructive' : 'text-muted-foreground'}>{debug.token}</span></p>
              <p>micPermission: <span className={debug.micPermission === 'granted' ? 'text-green-600' : debug.micPermission === 'denied' ? 'text-destructive' : 'text-muted-foreground'}>{debug.micPermission}</span></p>
              <p>audioTracks: {debug.audioTracksCount}</p>
              <p>session: <span className={debug.session === 'started' || debug.session === 'fallback-ws' ? 'text-green-600' : debug.session === 'failed' ? 'text-destructive' : 'text-muted-foreground'}>{debug.session}</span></p>
              <p>status (SDK): {conversation.status}</p>
              <p>isSpeaking: <span className={isSpeaking ? 'text-green-600 font-bold' : ''}>{String(isSpeaking)}</span></p>
              <p>greetingSent: <span className={debug.greetingSent ? 'text-green-600' : 'text-muted-foreground'}>{String(debug.greetingSent)}</span></p>
              <p>lastEventType: <span className="text-primary">{debug.lastEventType || '—'}</span></p>
              <p>messageCount: {debug.messageCount} | audioEvents: {debug.audioEventCount}</p>
              {debug.lastRawMessage && <p className="break-all">lastRaw: <span className="text-muted-foreground">{debug.lastRawMessage}</span></p>}
              {debug.lastError && <p>lastError: <span className="text-destructive">{debug.lastError}</span></p>}
            </motion.div>
          )}
        </AnimatePresence>

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

      <MenuPickerModal payload={pickerPayload} onClose={() => setPickerPayload(null)} />
    </>
  );
};

export default VoiceAssistant;
