import React, { useState, useEffect } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Radio, CloudRain, Sparkles, Disc } from 'lucide-react';
import { musicEngine, SoundscapeType } from '../utils/musicEngine';
import { useTranslation } from '../i18n/LanguageContext';

export const AmbientPlayer: React.FC = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState<boolean>(musicEngine.getIsPlaying());
  const [volume, setVolume] = useState<number>(musicEngine.getVolume());
  const [soundscape, setSoundscape] = useState<SoundscapeType>(musicEngine.getSoundscape());
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsub = musicEngine.subscribe(() => {
      setIsPlaying(musicEngine.getIsPlaying());
      setVolume(musicEngine.getVolume());
      setSoundscape(musicEngine.getSoundscape());
    });
    return unsub;
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    musicEngine.setVolume(val);
  };

  const handleTogglePlay = () => {
    musicEngine.togglePlay();
  };

  const handleSelectSoundscape = (type: SoundscapeType) => {
    musicEngine.setSoundscape(type);
  };

  return (
    <div className="relative">
      {/* Compact Trigger Button */}
      <button
        id="ambient-player-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer text-xs font-semibold ${
          isPlaying
            ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
            : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
        }`}
        title={t.common.ambientMusic}
      >
        <Music className={`w-3.5 h-3.5 ${isPlaying ? 'text-sky-400 animate-bounce' : 'text-slate-400'}`} />
        <span className="hidden sm:inline">
          {isPlaying ? t.music.playing : t.common.ambientMusic}
        </span>
        {isPlaying && (
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
        )}
      </button>

      {/* Floating Control Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0b1329] border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn backdrop-blur-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <Disc className={`w-4 h-4 text-sky-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
              <span className="text-xs font-bold text-white tracking-wide">{t.common.ambientMusic}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white text-xs p-1 rounded-md hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="py-3 space-y-3">
            {/* Soundscape Options */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 font-medium">{t.common.presets}:</label>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => handleSelectSoundscape('lofi')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                    soundscape === 'lofi'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5 mb-1" />
                  <span className="truncate w-full text-center">Lo-Fi</span>
                </button>
                <button
                  onClick={() => handleSelectSoundscape('ambient')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                    soundscape === 'ambient'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 mb-1" />
                  <span className="truncate w-full text-center">Ambient</span>
                </button>
                <button
                  onClick={() => handleSelectSoundscape('rain')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                    soundscape === 'rain'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5 mb-1" />
                  <span className="truncate w-full text-center">Rain</span>
                </button>
              </div>
            </div>

            {/* Play/Pause & Volume Slider */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{t.common.volume}:</span>
                <span className="font-mono text-sky-400 font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleTogglePlay}
                  className={`p-2.5 rounded-full flex items-center justify-center transition cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                      : 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/25'
                  }`}
                  title={isPlaying ? t.music.paused : t.music.playing}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
