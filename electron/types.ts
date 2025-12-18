// Re-exporting types for Electron
export type DownloadStatus = 'pending' | 'downloading' | 'transcoding' | 'complete' | 'error' | 'downloading-video' | 'downloading-audio' | 'merging';
export type VideoQuality = '2160p' | '1440p' | '1080p' | '720p' | '480p' | '360p' | '240p' | '144p';
export type AudioBitrate = '128kbps' | '96kbps' | '64kbps' | '48kbps';
export type AudioFormat = 'MP3' | 'OPUS' | 'AAC';
export type MediaType = 'video' | 'audio' | 'image';

export interface FormatInfo {
    formatId: string;
    ext: string;
    quality: string;
    resolution?: string;
    fps?: number;
    vcodec?: string;
    acodec?: string;
    filesize?: number;
    abr?: number;
    vbr?: number;
}

export interface VideoInfo {
    id: string;
    title: string;
    description: string;
    duration: number;
    thumbnail: string;
    uploader: string;
    uploadDate: string;
    viewCount: number;
    formats: FormatInfo[];
    availableQualities: VideoQuality[];
    availableAudioBitrates: number[];
}

export interface DownloadRequest {
    url: string;
    type: MediaType;
    format: string;
    quality: string;
}

export interface DownloadJob {
    id: string;
    videoId: string;
    videoTitle: string;
    status: DownloadStatus;
    progress: number;
    type: MediaType;
    format: string;
    quality: string;
    actualQuality?: string;
    outputPath?: string;
    error?: string;
    createdAt: Date;
    updatedAt: Date;
}
