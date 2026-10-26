import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Volume2,
  VolumeX,
  Download,
  Play,
  Pause,
  Sliders,
  CheckCircle,
  FileAudio,
  Layers,
  Wand2,
} from 'lucide-react';
import { api } from '../services/api';

export const BrandStudioView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'image' | 'tts'>('image');

  // Image Generation State (Embedded Vector Asset Engine with 1K, 2K, 4K)
  const [imagePrompt, setImagePrompt] = useState(
    'Modern tech company recruitment banner: Hiring Senior AI Systems Engineers. Minimalist dark corporate aesthetic with glowing blue holographic nodes and clean typography.'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Text-to-Speech State (Embedded Speech Synthesis)
  const [ttsText, setTtsText] = useState(
    'Welcome to the Acme Cloud executive hiring committee. Today we are reviewing top candidates for the Senior AI Systems Engineer opening. Elena Rostova demonstrated exceptional proficiency in vector database retrieval and distributed inference architectures.'
  );
  const [voiceName, setVoiceName] = useState('Kore');
  const [generatingTTS, setGeneratingTTS] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || generatingImage) return;
    setGeneratingImage(true);
    try {
      const res = await api.generateRecruitmentImage(imagePrompt, aspectRatio, imageSize);
      if (res.imageUrl) {
        setGeneratedImageUrl(res.imageUrl);
      }
    } catch (e) {
      console.error('Image gen error:', e);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleGenerateTTS = async () => {
    if (!ttsText.trim() || generatingTTS) return;
    setGeneratingTTS(true);
    try {
      const res = await api.generateSpeechTTS(ttsText, voiceName);
      if (res.audioBase64) {
        setAudioBase64(res.audioBase64);
        const audio = new Audio(`data:audio/wav;base64,${res.audioBase64}`);
        audio.onended = () => setIsPlaying(false);
        setAudioPlayer(audio);
        audio.play();
        setIsPlaying(true);
      } else {
        // Fallback Web Speech synthesis
        if ('speechSynthesis' in window) {
          const u = new SpeechSynthesisUtterance(ttsText);
          u.onend = () => setIsPlaying(false);
          window.speechSynthesis.speak(u);
          setIsPlaying(true);
        }
      }
    } catch (e) {
      console.error('TTS error:', e);
    } finally {
      setGeneratingTTS(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioPlayer) return;
    if (isPlaying) {
      audioPlayer.pause();
      setIsPlaying(false);
    } else {
      audioPlayer.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          Employer Brand & Speech Studio
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            HireMatch Studio
          </span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Generate high-resolution recruitment social assets (1K, 2K, 4K) with our embedded vector engine and listen to executive candidate briefs via speech synthesis.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('image')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'image'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>High-Quality Image Generator (Vector Asset Engine)</span>
        </button>
        <button
          onClick={() => setActiveTab('tts')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'tts'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>Candidate Briefing Speech Reader (Speech Synthesizer)</span>
        </button>
      </div>

      {/* TAB 1: HIGH QUALITY IMAGE GENERATION */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <span>Configure Asset Prompt & Specifications</span>
            </h2>

            {/* Prompt input */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Recruitment Branding Visual Prompt
              </label>
              <textarea
                rows={4}
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the recruitment banner aesthetic, technology icons, team culture..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Resolution Affordance: 1K, 2K, 4K */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center justify-between">
                <span>Output Resolution (Affordance: 1K, 2K, 4K)</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                  hirematch-nlp-vector-engine
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['1K', '2K', '4K'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      imageSize === sz
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {sz} Resolution
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Aspect Ratio
              </label>
              <div className="flex gap-2 text-xs">
                {['16:9', '1:1', '4:3'].map((ar) => (
                  <button
                    key={ar}
                    type="button"
                    onClick={() => setAspectRatio(ar)}
                    className={`px-3 py-1.5 rounded-lg font-semibold border ${
                      aspectRatio === ar
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateImage}
              disabled={generatingImage || !imagePrompt.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>{generatingImage ? 'Generating High-Quality Asset...' : `Generate ${imageSize} Asset`}</span>
            </button>
          </div>

          {/* Generated Asset Preview */}
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                Generated Employer Brand Asset
              </h2>

              {generatedImageUrl ? (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950 shadow-md">
                  <img
                    src={generatedImageUrl}
                    alt="Generated Recruitment Asset"
                    className="w-full h-auto object-cover max-h-[320px]"
                  />
                </div>
              ) : (
                <div className="h-64 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-xs">
                    Configure your prompt and click Generate to produce a 1K, 2K, or 4K recruitment visual.
                  </p>
                </div>
              )}
            </div>

            {generatedImageUrl && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-mono text-slate-500">
                  {imageSize} • {aspectRatio}
                </span>
                <a
                  href={generatedImageUrl}
                  download={`HireMatch_${imageSize}_Banner.png`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Image</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEXT-TO-SPEECH STUDIO */}
      {activeTab === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-500" />
              <span>Voice Briefing Synthesis (Speech Engine)</span>
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Candidate Summary or Feedback Text
              </label>
              <textarea
                rows={6}
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                placeholder="Enter candidate profile notes or interview synthesis to convert to speech..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Prebuilt Executive Voice Persona
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['Kore', 'Fenrir', 'Puck', 'Zephyr'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVoiceName(v)}
                    className={`py-2 px-2 text-xs font-bold rounded-xl border ${
                      voiceName === v
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateTTS}
              disabled={generatingTTS || !ttsText.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>{generatingTTS ? 'Synthesizing Audio...' : 'Synthesize & Play Audio'}</span>
            </button>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3">
                Audio Playback & Download
              </h2>

              <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
                  <FileAudio className="w-8 h-8" />
                </div>

                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Executive Speech Synthesis Audio
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    24kHz Mono 16-bit RIFF Audio Format • Voice: {voiceName}
                  </div>
                </div>

                {audioBase64 && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={toggleAudioPlay}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      <span>{isPlaying ? 'Pause' : 'Play Briefing'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {audioBase64 && (
              <div className="flex justify-end pt-2">
                <a
                  href={`data:audio/wav;base64,${audioBase64}`}
                  download="Candidate_Briefing.wav"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download WAV Audio File</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
