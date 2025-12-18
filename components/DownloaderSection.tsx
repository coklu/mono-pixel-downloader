import React, { useState, useEffect, useRef } from 'react';
import PixelFrame from './PixelFrame.tsx';
import PixelButton from './PixelButton.tsx';
import { PIXEL_ICONS } from '../constants';
import { sounds } from '../utils/audio';
import { DownloadStage } from '../types';
import {
  analyzeUrl,
  startDownload as apiStartDownload,
  subscribeToProgress,
  downloadFile,
  VideoInfo,
  ProgressUpdate
} from '../utils/api';
import CRTTerminal from './CRTTerminal';

const FORMATS = {
  VIDEO: [
    { label: '4K_UHD', res: '2160p', ext: 'MP4' },
    { label: '2K_QHD', res: '1440p', ext: 'MP4' },
    { label: 'FULL_HD', res: '1080p', ext: 'MP4' },
    { label: 'HD_READY', res: '720p', ext: 'MP4' },
    { label: 'SD', res: '480p', ext: 'MP4' },
    { label: 'SD_LOW', res: '360p', ext: 'MP4' },
    { label: 'LOW', res: '240p', ext: 'MP4' },
    { label: 'MINIMAL', res: '144p', ext: 'MP4' },
  ],
  AUDIO: [
    { label: 'HI_FI', rate: '128kbps', ext: 'MP3' },
    { label: 'BALANCED', rate: '96kbps', ext: 'MP3' },
    { label: 'MOBILE', rate: '64kbps', ext: 'MP3' },
    { label: 'LO_FI', rate: '48kbps', ext: 'MP3' },
    { label: 'OPUS_HQ', rate: '128kbps', ext: 'OPUS' },
    { label: 'OPUS_MED', rate: '96kbps', ext: 'OPUS' },
    { label: 'OPUS_MOB', rate: '64kbps', ext: 'OPUS' },
    { label: 'OPUS_LO', rate: '48kbps', ext: 'OPUS' },
    { label: 'AAC_PRO', rate: '128kbps', ext: 'AAC' },
    { label: 'AAC_MED', rate: '96kbps', ext: 'AAC' },
    { label: 'AAC_MOB', rate: '64kbps', ext: 'AAC' },
    { label: 'AAC_LITE', rate: '48kbps', ext: 'AAC' },
  ],
  IMAGE: [
    { label: 'POSTER', res: 'MAX_RES', ext: 'WEBP' },
  ]
};

const DownloaderSection: React.FC = () => {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<DownloadStage>(DownloadStage.IDLE);
  const [progress, setProgress] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState<any>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [actualQuality, setActualQuality] = useState<string | null>(null);
  const [showManifesto, setShowManifesto] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    setError(null);
    sounds.type();
  };

  const startScan = async () => {
    if (!url) return;
    setStage(DownloadStage.SCANNING);
    sounds.click();

    // Easter Egg Check
    if (url.trim().toLowerCase() === 'piracyisright') {
      setShowManifesto(true);
      setStage(DownloadStage.IDLE);
      return;
    }

    const result = await analyzeUrl(url);

    if (result.success && result.data) {
      setVideoInfo(result.data);
      setStage(DownloadStage.SELECTING);
      sounds.success();
    } else {
      setError(result.error || 'Failed to analyze URL');
      setStage(DownloadStage.IDLE);
      sounds.click();
    }
  };

  const startDownload = async (format: any) => {
    if (!videoInfo) return;

    setSelectedFormat(format);
    setStage(DownloadStage.DOWNLOADING);
    setProgress(0);
    setActualQuality(null);
    sounds.click();

    // Determine media type
    let type: 'video' | 'audio' | 'image';
    let quality: string;

    if (format.res) {
      type = format.ext === 'WEBP' ? 'image' : 'video';
      quality = format.res;
    } else {
      type = 'audio';
      quality = format.rate;
    }

    const result = await apiStartDownload(url, type, format.ext, quality, videoInfo.title);

    if (result.success && result.jobId) {
      setJobId(result.jobId);

      // Subscribe to progress updates
      unsubscribeRef.current = subscribeToProgress(
        result.jobId,
        (update: ProgressUpdate) => {
          setProgress(update.progress);

          if (update.actualQuality) {
            setActualQuality(update.actualQuality);
          }

          if (update.status === 'downloading' || update.status === 'downloading-video') {
            setStatusMessage('DOWNLOADING_VIDEO...');
          } else if (update.status === 'downloading-audio') {
            setStatusMessage('DOWNLOADING_AUDIO...');
          } else if (update.status === 'transcoding' || update.status === 'merging') {
            setStatusMessage('MERGING_STREAMS...');
          } else if (update.status === 'complete') {
            setStage(DownloadStage.COMPLETE);
            sounds.success();
          } else if (update.status === 'error') {
            setError(update.message || 'Download failed');
            setStage(DownloadStage.IDLE);
          }
        },
        (error) => {
          setError(error);
          setStage(DownloadStage.IDLE);
        }
      );
    } else {
      setError(result.error || 'Failed to start download');
      setStage(DownloadStage.IDLE);
    }
  };

  const handleDownloadFile = () => {
    // In Electron, the file is already saved where the user chose during startDownload
    reset();
    sounds.click();
  };

  const handleGoBack = () => {
    setStage(DownloadStage.SELECTING);
    setProgress(0);
    setJobId(null);
    setError(null);
    setStatusMessage('');
    setActualQuality(null);
    sounds.click();
  };

  const reset = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    setStage(DownloadStage.IDLE);
    setUrl('');
    setSelectedFormat(null);
    setVideoInfo(null);
    setJobId(null);
    setError(null);
    setProgress(0);
    setStatusMessage('');
    setActualQuality(null);
    sounds.click();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Check if quality is available
  const isQualityAvailable = (res: string) => {
    if (!videoInfo) return true;
    return videoInfo.availableQualities.includes(res);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 py-12 relative min-h-[600px]">
      {/* Dynamic Header */}
      <div className="text-center space-y-4">
        <div className="inline-block p-2 bg-white text-black text-[10px] mb-4 uppercase tracking-tighter">
          STATUS: {stage} // SESSION_ID: {Math.random().toString(16).slice(2, 8).toUpperCase()}
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase italic">
          {stage === DownloadStage.IDLE ? 'Ingest_Stream' : 'Task_Output'}
        </h1>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border-2 border-red-500 p-4 text-center animate-pulse">
          <div className="text-xs uppercase tracking-widest text-red-400">ERROR_DETECTED</div>
          <div className="text-sm mt-2">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-3 text-[10px] uppercase tracking-widest opacity-60 hover:opacity-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {stage === DownloadStage.IDLE && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <PixelFrame variant="black" className="p-1">
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              <div className="flex-1 relative flex items-center bg-black border-2 border-white focus-within:border-[6px] transition-all duration-75 px-4 py-3">
                <span className="mr-3 opacity-40 font-bold">{">>"}</span>
                <input
                  type="text"
                  value={url}
                  onChange={handleInputChange}
                  onKeyDown={(e) => e.key === 'Enter' && startScan()}
                  placeholder="PASTE YOUTUBE URL HERE..."
                  className="bg-transparent border-none outline-none w-full text-white placeholder:text-white/20 uppercase text-xs tracking-widest caret-white"
                />
              </div>
              <PixelButton onClick={startScan} className="md:w-48 !bg-white !text-black !border-none">
                ANALYZE
              </PixelButton>
            </div>
          </PixelFrame>
          <p className="text-center text-[10px] opacity-40 uppercase tracking-[0.3em]">Supported: MP4, MP3, OPUS, AAC, WEBP</p>
        </div>
      )}

      {stage === DownloadStage.SCANNING && (
        <div className="flex flex-col items-center justify-center py-20 space-y-8">
          <div className="w-16 h-16 border-4 border-white border-t-transparent animate-spin"></div>
          <div className="text-xl italic animate-pulse">PARSING_METADATA...</div>
          <div className="text-[10px] opacity-50 font-mono">FETCHING: {url.slice(0, 40)}...</div>
        </div>
      )}

      {stage === DownloadStage.SELECTING && videoInfo && (
        <div className="space-y-12 animate-in zoom-in-95 duration-300">
          {/* Video Info */}
          <div className="border-2 border-white/30 p-4 space-y-2">
            <div className="text-xs opacity-50 uppercase tracking-widest">VIDEO_DETECTED</div>
            <div className="text-lg font-bold truncate">{videoInfo.title}</div>
            <div className="flex gap-4 text-[10px] opacity-60">
              <span>ID: {videoInfo.id}</span>
              <span>DURATION: {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}</span>
              <span>BY: {videoInfo.uploader}</span>
            </div>
          </div>

          {/* Video Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold border-l-4 border-white pl-3 uppercase tracking-widest">Video Output (MP4)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FORMATS.VIDEO.map((f, i) => {
                const available = isQualityAvailable(f.res);
                return (
                  <div
                    key={i}
                    onClick={() => startDownload(f)}
                    onMouseEnter={() => sounds.hover()}
                    className={`border-2 p-3 text-center cursor-pointer transition-all group active:scale-95 ${available
                      ? 'border-white hover:bg-white hover:text-black'
                      : 'border-white/30 opacity-50 hover:border-white/50'
                      }`}
                  >
                    <div className="text-[10px] font-bold">{f.res}</div>
                    <div className="text-[8px] opacity-40 group-hover:opacity-100">
                      {f.label} {!available && '(FALLBACK)'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Audio Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold border-l-4 border-white pl-3 uppercase tracking-widest">Audio Output</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FORMATS.AUDIO.map((f, i) => (
                <div
                  key={i}
                  onClick={() => startDownload(f)}
                  onMouseEnter={() => sounds.hover()}
                  className="border-2 border-white/40 p-3 text-center cursor-pointer hover:border-white hover:bg-white hover:text-black transition-all group active:scale-95"
                >
                  <div className="text-[10px] font-bold">{f.ext} @ {f.rate}</div>
                  <div className="text-[8px] opacity-40 group-hover:opacity-100">{f.label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Extra Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-bold border-l-4 border-white pl-3 uppercase tracking-widest">Visual Assets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {FORMATS.IMAGE.map((f, i) => (
                <div
                  key={i}
                  onClick={() => startDownload(f)}
                  onMouseEnter={() => sounds.hover()}
                  className="border-2 border-white/20 p-3 text-center cursor-pointer hover:border-white hover:bg-white hover:text-black transition-all group active:scale-95"
                >
                  <div className="text-[10px] font-bold">{f.ext}</div>
                  <div className="text-[8px] opacity-40 group-hover:opacity-100">{f.label}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="pt-8 text-center">
            <button onClick={reset} className="text-[8px] uppercase tracking-widest opacity-40 hover:opacity-100 hover:underline">Cancel & Return</button>
          </div>
        </div>
      )}

      {stage === DownloadStage.DOWNLOADING && (
        <div className="max-w-md mx-auto py-20 space-y-8 text-center animate-in fade-in">
          <div className="text-2xl italic font-bold">{statusMessage || 'INITIALIZING...'}</div>
          <div className="text-[10px] uppercase opacity-50">
            {selectedFormat?.ext} // {actualQuality || selectedFormat?.res || selectedFormat?.rate}
            {actualQuality && actualQuality !== selectedFormat?.res && (
              <span className="ml-2 text-yellow-400">(FALLBACK FROM {selectedFormat?.res})</span>
            )}
          </div>

          <div className="w-full border-4 border-white p-1">
            <div
              className="h-6 bg-white transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="text-right font-mono text-xs">{Math.floor(progress)}% COMPLETED</div>
          <div className="text-[8px] opacity-40 animate-pulse">DO NOT CLOSE TERMINAL...</div>
        </div>
      )}

      {stage === DownloadStage.COMPLETE && (
        <div className="max-w-md mx-auto py-20 space-y-12 text-center animate-in zoom-in-90">
          <div className="flex justify-center">
            <div className="w-24 h-24 border-8 border-white flex items-center justify-center text-4xl animate-bounce">
              {PIXEL_ICONS.HEART}
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold italic underline">TASK_COMPLETE</h2>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">
              {videoInfo?.title || 'File'} has been successfully processed.
            </p>
            {actualQuality && actualQuality !== selectedFormat?.res && (
              <p className="text-[10px] text-yellow-400 uppercase">
                Note: Downloaded at {actualQuality} (requested {selectedFormat?.res} was unavailable)
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <PixelButton onClick={handleGoBack} className="!border-white !text-white hover:!bg-white/10">CHANGE_FORMAT</PixelButton>
            <PixelButton onClick={handleDownloadFile} className="!bg-white !text-black">CONVERT_ANOTHER</PixelButton>
          </div>
        </div>
      )}

      {/* Progress Decoration for all stages */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none overflow-hidden">
        <div className="text-[8px] font-mono whitespace-pre">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i}>{Math.random().toString(2).slice(2, 20)}</div>
          ))}
        </div>
      </div>
      {/* Manifesto Overlay */}
      {showManifesto && <CRTTerminal onClose={() => setShowManifesto(false)} />}
    </div>
  );
};

export default DownloaderSection;
