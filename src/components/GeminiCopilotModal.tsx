import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  X,
  Bot,
  User,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { SupportedLanguage } from '../types';
import { t } from '../utils/translations';

interface Message {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
}

interface GeminiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: SupportedLanguage;
  initialPrompt?: string;
}

export const GeminiCopilotModal: React.FC<GeminiCopilotModalProps> = ({
  isOpen,
  onClose,
  language,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'gemini',
      text: language === 'hi'
        ? 'नमस्ते! मैं मेडीफ्लक्स एआई कोपायलट हूँ। आप मुझसे भारत के सार्वजनिक स्वास्थ्य नेटवर्क में दवाओं की उपलब्धता, बिस्तर अधिभोग, या पुनर्वितरण के संबंध में वास्तविक डेटा पर आधारित प्रश्न पूछ सकते हैं।'
        : 'Hello! I am MediFlux AI Copilot. Ask me anything about medicine inventories, bed shortages, outbreak forecasts, or inter-district redistribution options grounded in live public health data.',
      timestamp: 'Just now'
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const suggestedPrompts = language === 'hi' ? [
    'उत्तर प्रदेश में सबसे बड़ा दवा जोखिम क्या है?',
    'लखनऊ में अगले 7 दिनों में कौन सी दवा की कमी हो सकती है?',
    'डेंगू प्रकोप बढ़ने पर क्या प्रभाव पड़ेगा?',
    'कानपुर से लखनऊ में ओआरएस कैसे स्थानांतरित करें?'
  ] : [
    'What is the biggest resource risk in Uttar Pradesh?',
    'Which districts face medicine shortages in the next 7 days?',
    'Why is PHC Lucknow Rural marked critical for ORS?',
    'Where should surplus ORS be redistributed from?'
  ];

  useEffect(() => {
    if (initialPrompt) {
      setInputPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language })
      });

      if (!res.ok) throw new Error('Copilot response error');

      const data = await res.json();
      const botMsg: Message = {
        id: `g-${Date.now()}`,
        sender: 'gemini',
        text: data.text || 'No response received from Gemini.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'gemini',
          text: `Error connecting to Gemini API: ${err.message || 'Network error'}`,
          timestamp: 'Just now'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Browser Speech Recognition for voice input
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputPrompt(transcript);
        handleSend(transcript);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-2xl h-[620px] rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  {t('copilot', language)}
                </h3>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md">
                  Grounded on Live Data
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Powered by Google Gemini 3.8 Flash • {language === 'hi' ? 'हिंदी समर्थित' : 'English / Hindi bilingual'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs bg-slate-50/50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 ${m.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-blue-600'
                }`}
              >
                {m.sender === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3.5 leading-relaxed whitespace-pre-line shadow-xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}
              >
                {m.text}
                <span className={`block text-[9px] mt-1.5 font-medium ${m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-blue-600 text-xs p-2">
              <Sparkles className="h-4 w-4 animate-spin" />
              <span>Gemini is synthesizing live healthcare data...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              className="flex-shrink-0 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 transition-colors font-medium"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleSpeechRecognition}
            title={isListening ? 'Stop listening' : 'Start voice input'}
            className={`p-2.5 rounded-xl transition-colors ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder={t('typeMessage', language)}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl transition-colors shadow-xs"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
