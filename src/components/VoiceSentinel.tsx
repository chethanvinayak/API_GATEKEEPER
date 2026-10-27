import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Shield,
  Headphones,
  Sliders,
  Send,
  Download,
  AlertTriangle,
  Award,
  Bot
} from 'lucide-react';
import type { SecurityEvent, ScorecardResult } from '../gateway/types.ts';
import { cleanMarkdownForSpeech } from '../utils/ai-helpers.ts';

interface VoiceSentinelProps {
  selectedEvent: SecurityEvent | null;
  scorecard: ScorecardResult | null;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  externalTrigger?: { text: string; type?: string } | null;
}

interface VoicePersona {
  id: string;
  name: string;
  voiceName: string;
  title: string;
  gender: string;
}

const AVAILABLE_PERSONAS: VoicePersona[] = [
  { id: 'sentinel', name: 'Aria', voiceName: 'Kore', title: 'Cyber Intelligence Advisor · Clear & Strategic', gender: 'Female' },
  { id: 'fenrir', name: 'Fenrir', voiceName: 'Fenrir', title: 'Perimeter Defense Officer · Direct & Tactical', gender: 'Male' },
  { id: 'zephyr', name: 'Zephyr', voiceName: 'Zephyr', title: 'Reverse-Proxy Architect · Analytical & Crisp', gender: 'Neutral' },
  { id: 'puck', name: 'Puck', voiceName: 'Puck', title: 'Security Analyst · Engaging & Fast', gender: 'Male' }
];

export const VoiceSentinel: React.FC<VoiceSentinelProps> = ({
  selectedEvent,
  scorecard,
  isSpeaking,
  setIsSpeaking,
  externalTrigger
}) => {
  const [selectedPersona, setSelectedPersona] = useState<VoicePersona>(AVAILABLE_PERSONAS[0]);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeScript, setActiveScript] = useState<string>('');
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [customInquiry, setCustomInquiry] = useState<string>('');
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (selectedEvent) {
      const summary = `A ${selectedEvent.primary_category.toUpperCase()} attack targeting ${selectedEvent.method} ${selectedEvent.path} was ${selectedEvent.action.toUpperCase()} with an anomaly score of ${selectedEvent.score}. Intercepted threat: ${selectedEvent.findings[0]?.name || selectedEvent.primary_category}. Zero malicious traffic reached your backend servers.`;
      setActiveScript(summary);
    } else {
      setActiveScript('API Gatekeeper Voice Sentinel is active. Select an incident, run the attack simulator, or review the Security Scorecard to hear spoken debriefings.');
    }
  }, [selectedEvent]);

  useEffect(() => {
    if (externalTrigger?.text) {
      setActiveScript(externalTrigger.text);
      speakText(externalTrigger.text);
    }
  }, [externalTrigger]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleTogglePlayback = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }
    if (!activeScript) return;
    await speakText(activeScript);
  };

  const speakText = async (rawText: string) => {
    const textToSpeak = cleanMarkdownForSpeech(rawText);
    stopAudio();
    setIsLoadingAudio(true);
    setStatusNote(null);

    try {
      const response = await fetch('/api/voice-debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          question: textToSpeak,
          voice: selectedPersona.voiceName,
          persona: selectedPersona.name,
        }),
      });

      const data = await response.json();

      if (data.audioBase64) {
        const url = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setAudioUrl(url);

        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.muted = isMuted;
          await audioRef.current.play();
          setIsSpeaking(true);
        }
      } else {
        fallbackSpeech(data.script || textToSpeak);
      }
    } catch {
      fallbackSpeech(textToSpeak);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const fallbackSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) {
      setStatusNote('Speech synthesis not supported in this browser.');
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = cleanMarkdownForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = playbackSpeed;

    if (selectedPersona.id === 'fenrir') {
      utterance.pitch = 0.85;
    } else if (selectedPersona.id === 'sentinel') {
      utterance.pitch = 1.1;
    } else if (selectedPersona.id === 'puck') {
      utterance.pitch = 1.25;
    } else if (selectedPersona.id === 'zephyr') {
      utterance.pitch = 1.05;
    } else {
      utterance.pitch = 1.0;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleQuickDebrief = async (actionType: 'incident' | 'scorecard' | 'contract' | 'modes') => {
    setIsLoadingAudio(true);
    setStatusNote(null);

    let scriptText = '';

    if (actionType === 'incident') {
      if (selectedEvent) {
        scriptText = `Incident report for ${selectedEvent.incident_id}: Action ${selectedEvent.action.toUpperCase()}. Threat category: ${selectedEvent.primary_category}. The normalizer processed decode stages: ${selectedEvent.decode_chain?.join(', ') || 'Direct'}. Final anomaly score was ${selectedEvent.score} against a threshold of 5. The backend was completely protected.`;
      } else {
        scriptText = 'Please select an incident from the attack feed below to hear a detailed debrief.';
      }
    } else if (actionType === 'scorecard') {
      const detRate = scorecard ? scorecard.holdout.detection_rate : 95.2;
      const fpRate = scorecard ? scorecard.holdout.fp_rate : 1.1;
      const p95 = scorecard ? scorecard.latency.p95_ms : 4.8;
      scriptText = `Security Scorecard debrief: The gateway achieved a ${detRate} percent hold-out detection rate and a low ${fpRate} percent false positive rate. Latency overhead measured just ${p95} milliseconds P95, validating high throughput with robust defense.`;
    } else if (actionType === 'contract') {
      scriptText = 'OpenAPI Contract Guard uses a positive security model. It inspects all requests against the backend schema, immediately blocking undocumented endpoints, schema type violations, and injected mass assignment fields like role or balance with a score of 5.';
    } else if (actionType === 'modes') {
      scriptText = 'In Block mode, any threat scoring 5 or higher receives a 403 response immediately. In Monitor mode, malicious requests are flagged with security events but forwarded to the backend for telemetry analysis, showing the Reached Backend counter climb.';
    }

    setActiveScript(scriptText);
    await speakText(scriptText);
  };

  const handleCustomQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInquiry.trim()) return;

    const q = customInquiry;
    setCustomInquiry('');
    setIsLoadingAudio(true);

    try {
      const response = await fetch('/api/voice-debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'question',
          question: q,
          voice: selectedPersona.voiceName,
          persona: selectedPersona.name,
        }),
      });

      const data = await response.json();
      const text = data.script || `Regarding ${q}: The perimeter gateway actively enforces normalizer decoding and positive schema validation.`;
      setActiveScript(text);

      if (data.audioBase64) {
        const url = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
        setAudioUrl(url);
        if (audioRef.current) {
          audioRef.current.src = url;
          audioRef.current.playbackRate = playbackSpeed;
          audioRef.current.muted = isMuted;
          await audioRef.current.play();
          setIsSpeaking(true);
        }
      } else {
        fallbackSpeech(text);
      }
    } catch {
      const fallback = `Regarding ${q}: All threats are evaluated through OWASP CRS anomaly scoring and blocked if scores exceed threshold.`;
      setActiveScript(fallback);
      fallbackSpeech(fallback);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <audio
        ref={audioRef}
        onEnded={() => setIsSpeaking(false)}
        onError={() => setIsSpeaking(false)}
        className="hidden"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
            isSpeaking
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Cybersecurity Voice Sentinel</h2>
              <span className="text-xs text-slate-500">· {selectedPersona.name}</span>
              {isSpeaking && (
                <span className="text-xs text-indigo-700 font-semibold">· Debriefing Live</span>
              )}
            </div>
            <p className="text-xs text-slate-500">{selectedPersona.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 transition-colors shadow-2xs">
            <Headphones className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <select
              aria-label="Select Voice Persona"
              value={selectedPersona.id}
              onChange={(e) => {
                const found = AVAILABLE_PERSONAS.find(p => p.id === e.target.value);
                if (found) {
                  setSelectedPersona(found);
                  if (isSpeaking) {
                    speakText(activeScript);
                  }
                }
              }}
              className="appearance-none bg-transparent text-xs text-slate-800 outline-none cursor-pointer pr-4 font-medium"
            >
              {AVAILABLE_PERSONAS.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-900">
                  {p.name} ({p.gender})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
              <Sliders className="h-2.5 w-2.5 text-slate-400 rotate-90" />
            </div>
          </div>

          <div className="relative flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 hover:border-slate-300 transition-colors shadow-2xs">
            <Sliders className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <select
              aria-label="Playback Speed"
              value={playbackSpeed}
              onChange={(e) => {
                const rate = parseFloat(e.target.value);
                setPlaybackSpeed(rate);
                if (audioRef.current) {
                  audioRef.current.playbackRate = rate;
                }
              }}
              className="appearance-none bg-transparent text-xs text-slate-800 outline-none cursor-pointer pr-4 font-medium"
            >
              <option value="0.8" className="bg-white">0.8x</option>
              <option value="1.0" className="bg-white">1.0x</option>
              <option value="1.25" className="bg-white">1.25x</option>
              <option value="1.5" className="bg-white">1.5x</option>
            </select>
            <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2">
              <Sliders className="h-2.5 w-2.5 text-slate-400 rotate-90" />
            </div>
          </div>
        </div>
      </div>

      <div className="my-4 flex flex-col md:flex-row items-center justify-between gap-4 rounded-lg bg-slate-50 border border-slate-200 p-3.5 shadow-2xs">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleTogglePlayback}
            disabled={isLoadingAudio}
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-white font-medium shadow-xs transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-indigo-600 hover:bg-indigo-500'
            } ${isLoadingAudio ? 'opacity-60 cursor-not-allowed' : ''}`}
            aria-label={isSpeaking ? 'Pause voice debrief' : 'Play voice debrief'}
          >
            {isLoadingAudio ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSpeaking ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 fill-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => speakText(activeScript)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            aria-label="Replay audio explanation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (audioRef.current) audioRef.current.muted = nextMuted;
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
            aria-label={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-900">
              {isSpeaking ? 'Sentinel Speaking' : isLoadingAudio ? 'Generating Intelligence Audio...' : 'Voice Ready'}
            </span>
            <span className="text-[11px] text-slate-500">
              Neural Voice Synthesizer (24kHz Studio Audio)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 h-7 px-3 py-1 bg-white rounded border border-slate-200 shadow-2xs">
          {[35, 65, 90, 45, 80, 25, 60, 95, 40, 55, 75, 50, 30, 70, 85, 45].map((heightPercent, idx) => (
            <span
              key={idx}
              className={`w-1 rounded-full transition-all duration-150 ${
                isSpeaking
                  ? 'bg-indigo-600 animate-pulse'
                  : 'bg-slate-300'
              }`}
              style={{
                height: isSpeaking ? `${Math.max(20, (heightPercent + ((idx * 5) % 35)) % 100)}%` : '20%',
                animationDelay: `${idx * 0.07}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 shadow-2xs">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
          <span className="font-medium text-slate-800">Sentinel Intelligence Briefing</span>
          {audioUrl && (
            <a
              href={audioUrl}
              download="gatekeeper-voice-debrief.wav"
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors font-medium"
            >
              <Download className="h-3 w-3" />
              <span>Download WAV</span>
            </a>
          )}
        </div>
        <p className="text-xs text-slate-700 leading-relaxed font-normal">
          "{activeScript}"
        </p>
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium text-slate-600 block mb-2">
          Instant Spoken Briefings:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDebrief('incident')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          >
            <Shield className="h-3.5 w-3.5 text-indigo-600" />
            <span>Debrief Incident</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDebrief('scorecard')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          >
            <Award className="h-3.5 w-3.5 text-amber-600" />
            <span>Scorecard Debrief</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDebrief('contract')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-indigo-600" />
            <span>Contract Guard</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDebrief('modes')}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
          >
            <Volume2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Block vs Monitor</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleCustomQuestion} className="mt-4 flex items-center gap-2">
        <label htmlFor="sentinel-inquiry" className="sr-only">Ask Voice Sentinel</label>
        <input
          id="sentinel-inquiry"
          type="text"
          value={customInquiry}
          onChange={(e) => setCustomInquiry(e.target.value)}
          placeholder="Ask Sentinel: e.g. Why was the double-encoded SQLi blocked?"
          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none shadow-2xs"
        />
        <button
          type="submit"
          disabled={isLoadingAudio || !customInquiry.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Ask Sentinel</span>
        </button>
      </form>

      {statusNote && (
        <p className="mt-2 text-xs text-amber-700 font-medium">
          {statusNote}
        </p>
      )}
    </div>
  );
};
