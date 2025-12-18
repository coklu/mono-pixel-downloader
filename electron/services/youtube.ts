import { spawn } from 'child_process';
import { VideoInfo, FormatInfo, VideoQuality } from '../types.js';
import { extractVideoId, isValidYouTubeUrl } from '../utils/fileNaming.js';
import { getBinaryPath } from './binaries.js';

const QUALITY_ORDER: VideoQuality[] = ['2160p', '1440p', '1080p', '720p', '480p', '360p', '240p', '144p'];

function runYtdlp(args: string[]): Promise<any> {
    const binary = getBinaryPath('yt-dlp');
    console.log(`[YouTube] Running: ${binary} ${args.join(' ')}`);
    return new Promise((resolve, reject) => {
        const proc = spawn(binary, args);
        let stdout = '';
        let stderr = '';

        const timeout = setTimeout(() => {
            proc.kill();
            reject(new Error('Analysis timed out after 30 seconds'));
        }, 30000);

        proc.stdout.on('data', (d) => stdout += d.toString());
        proc.stderr.on('data', (d) => stderr += d.toString());
        proc.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                try {
                    resolve(args.includes('--dump-single-json') ? JSON.parse(stdout) : stdout);
                } catch (e) { resolve(stdout); }
            } else reject(new Error(stderr || `yt-dlp exited with code ${code}`));
        });
        proc.on('error', (e) => {
            clearTimeout(timeout);
            reject(new Error(`Failed to run yt-dlp: ${e.message}`));
        });
    });
}

export function runYtdlpDownload(args: string[], onProgress?: (p: number) => void): Promise<void> {
    const binary = getBinaryPath('yt-dlp');
    console.log(`[YouTube] Downloading: ${binary} ${args.join(' ')}`);
    return new Promise((resolve, reject) => {
        const proc = spawn(binary, args);
        let stderr = '';
        proc.stdout.on('data', (data) => {
            const match = data.toString().match(/\[download\]\s+(\d+\.?\d*)%/);
            if (match && onProgress) onProgress(parseFloat(match[1]));
        });
        proc.stderr.on('data', (d) => stderr += d.toString());
        proc.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(stderr || `yt-dlp download failed`));
        });
        proc.on('error', (e) => reject(new Error(`Failed to run yt-dlp: ${e.message}`)));
    });
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
    if (!isValidYouTubeUrl(url)) throw new Error('Invalid YouTube URL');

    // Optimized flags for fast metadata fetching
    const optimizedArgs = [
        '--dump-single-json',
        '--no-playlist',           // Crucial: avoid scanning entire playlists
        '--flat-playlist',         // Combined safety
        '--no-check-certificates',
        '--no-warnings',
        '--no-call-home',
        '--no-cache-dir',
        '--skip-download',
        url
    ];

    const info = await runYtdlp(optimizedArgs);
    const formats = (info.formats || []).filter((f: any) => f.format_id && (f.vcodec !== 'none' || f.acodec !== 'none'))
        .map((f: any) => ({
            formatId: f.format_id, ext: f.ext, quality: f.format_note, resolution: f.resolution,
            fps: f.fps, vcodec: f.vcodec, acodec: f.acodec, filesize: f.filesize, abr: f.abr, vbr: f.vbr
        }));
    const heights = new Set<number>(info.formats.map((f: any) => f.height).filter(Boolean));
    const availableQualities = QUALITY_ORDER.filter(q => heights.has(parseInt(q)));
    const audioBitrates = Array.from(new Set<number>(info.formats.map((f: any) => Math.round(f.abr)).filter(Boolean))).sort((a, b) => b - a);
    return {
        id: info.id, title: info.title, description: info.description, duration: info.duration,
        thumbnail: info.thumbnail, uploader: info.uploader, uploadDate: info.upload_date,
        viewCount: info.view_count, formats, availableQualities, availableAudioBitrates: audioBitrates
    };
}

export function findBestVideoQuality(avail: VideoQuality[], req: string): VideoQuality | null {
    const normalized = req.toLowerCase().replace('p', '') + 'p';
    if (avail.includes(normalized as VideoQuality)) return normalized as VideoQuality;
    const idx = QUALITY_ORDER.indexOf(normalized as VideoQuality);
    if (idx === -1) return avail[0] || null;
    for (let i = idx; i < QUALITY_ORDER.length; i++) if (avail.includes(QUALITY_ORDER[i])) return QUALITY_ORDER[i];
    return avail[0] || null;
}
