import React, { useState, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { extractUIAction } from '@/lib/uiAction';
import MenuPickerModal, { MenuPickerPayload } from '@/components/MenuPickerModal';

const statusLabels: Record<string, string> = {
  connected: 'Подключён',
  disconnected: 'Отключён',
};

const VoiceAssistant: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentText, setAgentText] = useState('');
  const [error, setError] = useState('');
  const [pickerPayload, setPickerPayload] = useState<MenuPickerPayload | null>(null);

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
    onConnect: () => setError(''),
    onDisconnect: () => {},
    onError: (err) => setError(String(err)),
    onMessage: (message: any) => {
      if (message.type === 'user_transcript') {
        setTranscript(message.user_transcription_event?.user_transcript || '');
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
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data, error: fnError } = await supabase.functions.invoke('elevenlabs-signed-url');
      if (fnError || !data?.signed_url) {
        throw new Error(fnError?.message || 'Не удалось получить signed_url. Проверьте настройки.');
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
      });
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

  const statusDisplay = () => {
    if (isConnecting) return { text: 'Подключение...', icon: <Loader2 className="w-4 h-4 animate-spin" /> };
    if (!isActive) return null;
    if (conversation.isSpeaking) return { text: 'Speaking', icon: <Volume2 className="w-4 h-4 text-primary animate-pulse-soft" /> };
    return { text: 'Listening', icon: <Mic className="w-4 h-4 text-green-600 animate-pulse-soft" /> };
  };

  const status = statusDisplay();

  return (
    <>
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">🎙 Голосом</h3>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-secondary text-muted-foreground'
          }`}>
            {isConnecting ? 'Подключение...' : statusLabels[conversation.status] || conversation.status}
          </span>
        </div>

        {error && <p className="text-sm text-destructive mb-3 bg-destructive/10 p-2 rounded-lg">{error}</p>}

        {isActive && status && (
          <div className="flex items-center gap-2 text-sm mb-3">
            {status.icon}
            <span className="font-medium">{status.text}</span>
          </div>
        )}

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
          {isActive ? <><MicOff className="w-4 h-4" /> Завершить</> : <><Mic className="w-4 h-4" /> {isConnecting ? 'Подключение...' : 'Начать разговор'}</>}
        </button>
      </div>

      <MenuPickerModal payload={pickerPayload} onClose={() => setPickerPayload(null)} />
    </>
  );
};

export default VoiceAssistant;
