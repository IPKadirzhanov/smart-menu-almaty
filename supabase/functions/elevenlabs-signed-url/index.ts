import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
  const ELEVENLABS_AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID');

  if (!ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!ELEVENLABS_AGENT_ID) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_AGENT_ID not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch both signed_url (WebSocket) and token (WebRTC) for flexibility
    const [signedUrlRes, tokenRes] = await Promise.all([
      fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${ELEVENLABS_AGENT_ID}`,
        { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
      ),
      fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
        { headers: { 'xi-api-key': ELEVENLABS_API_KEY } }
      ),
    ]);

    if (!signedUrlRes.ok) {
      const errorBody = await signedUrlRes.text();
      throw new Error(`ElevenLabs signed-url error [${signedUrlRes.status}]: ${errorBody}`);
    }

    if (!tokenRes.ok) {
      const errorBody = await tokenRes.text();
      throw new Error(`ElevenLabs token error [${tokenRes.status}]: ${errorBody}`);
    }

    const signedUrlData = await signedUrlRes.json();
    const tokenData = await tokenRes.json();

    return new Response(JSON.stringify({
      signed_url: signedUrlData.signed_url,
      token: tokenData.token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error getting credentials:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
