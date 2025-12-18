/**
 * API client for YouTube Downloader
 * 
 * Re-routes calls to Electron IPC when running in Electron environment.
 */

// Extend window object for TypeScript
declare global {
    interface Window {
        electron: {
            invoke: (channel: string, data?: any) => Promise<any>;
            on: (channel: string, func: (...args: any[]) => void) => () => void;
        };
    }
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
    availableQualities: string[];
    availableAudioBitrates: number[];
}

export interface AnalyzeResponse {
    success: boolean;
    data?: VideoInfo;
    error?: string;
}

export interface DownloadStartResponse {
    success: boolean;
    jobId?: string;
    error?: string;
}

export interface ProgressUpdate {
    status: 'pending' | 'downloading' | 'transcoding' | 'complete' | 'error';
    progress: number;
    message?: string;
    actualQuality?: string;
}

/**
 * Analyze YouTube URL using Electron IPC
 */
export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
    if (window.electron) {
        return await window.electron.invoke('analyze-url', url);
    }
    return { success: false, error: 'Environment is not Electron' };
}

/**
 * Start download using Electron IPC
 */
export async function startDownload(
    url: string,
    type: 'video' | 'audio' | 'image',
    format: string,
    quality: string
): Promise<DownloadStartResponse> {
    if (window.electron) {
        return await window.electron.invoke('start-download', { url, type, format, quality });
    }
    return { success: false, error: 'Environment is not Electron' };
}

/**
 * Subscribe to download progress via Electron IPC
 */
export function subscribeToProgress(
    jobId: string,
    onUpdate: (update: ProgressUpdate) => void,
    onError: (error: string) => void
): () => void {
    if (window.electron) {
        return window.electron.on(`download-progress-${jobId}`, (update: ProgressUpdate) => {
            onUpdate(update);
        });
    }
    onError('Environment is not Electron');
    return () => { };
}

/**
 * Delete a job
 */
export async function deleteJob(jobId: string): Promise<boolean> {
    if (window.electron) {
        return await window.electron.invoke('delete-job', jobId);
    }
    return false;
}

// downloadFile is no longer needed as Electron saves directly via dialog
export function downloadFile(jobId: string, fileName?: string): void {
    console.log('File already saved via native dialog');
}
