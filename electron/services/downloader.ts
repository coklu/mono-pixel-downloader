import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { app } from 'electron';
import { DownloadJob, DownloadRequest } from '../types.js';
import { getVideoInfo as fetchVideoInfo, findBestVideoQuality, runYtdlpDownload } from './youtube.js';
import { transcodeAudio, muxVideoAudio, convertToWebp, cleanupTempFiles } from './transcoder.js';
import { extractVideoId } from '../utils/fileNaming.js';

const jobs = new Map<string, DownloadJob>();
const TEMP_DIR = path.join(app.getPath('userData'), 'temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

export { fetchVideoInfo, extractVideoId };
export const validateUrl = (url: string) => ({ valid: !!extractVideoId(url) });
export function getJob(id: string) { return jobs.get(id); }
export function deleteJob(id: string) { return jobs.delete(id); }

export async function startDownload(req: DownloadRequest, out: string, onUpdate: (u: any) => void): Promise<string> {
    const jobId = uuidv4();
    const videoId = extractVideoId(req.url)!;
    jobs.set(jobId, { id: jobId, videoId, videoTitle: '', status: 'pending', progress: 0, type: req.type, format: req.format, quality: req.quality, createdAt: new Date(), updatedAt: new Date() });

    (async () => {
        try {
            const info = await fetchVideoInfo(req.url);
            if (req.type === 'image') {
                onUpdate({ status: 'downloading', progress: 50 });
                await downloadThumbnail(info.thumbnail, info.id, out);
            } else if (req.type === 'audio') {
                const tmp = path.join(TEMP_DIR, `${info.id}_a_${Date.now()}.webm`);
                await runYtdlpDownload(['--no-playlist', '-f', 'bestaudio', '-o', tmp, req.url], (p) => onUpdate({ status: 'downloading', progress: p * 0.5 }));
                onUpdate({ status: 'transcoding', progress: 50 });
                await transcodeAudio(tmp, out, req.format, req.quality, (p) => onUpdate({ status: 'transcoding', progress: 50 + p * 0.5 }));
                cleanupTempFiles(tmp);
            } else {
                const quality = findBestVideoQuality(info.availableQualities, req.quality)!;
                const tmpV = path.join(TEMP_DIR, `${info.id}_v_${Date.now()}.mp4`);
                const tmpA = path.join(TEMP_DIR, `${info.id}_a_${Date.now()}.webm`);

                // Stage 1: Video (85% of total work)
                // Fallback to 'best' (combined) if 'bestvideo' (video-only) is unavailable.
                // Added width check for vertical videos (Shorts) where 1080p means 1080px width (1920px height).
                const h = parseInt(quality);
                onUpdate({ status: 'downloading-video', progress: 0, actualQuality: quality });
                await runYtdlpDownload(['--no-playlist', '-f', `bestvideo[height<=${h}]/bestvideo[width<=${h}]/best[height<=${h}]/best[width<=${h}]/best`, '-o', tmpV, req.url],
                    (p) => onUpdate({ status: 'downloading-video', progress: p * 0.85, actualQuality: quality }));

                // Stage 2: Audio (10% of total work)
                onUpdate({ status: 'downloading-audio', progress: 85, actualQuality: quality });
                await runYtdlpDownload(['--no-playlist', '-f', 'bestaudio', '-o', tmpA, req.url],
                    (p) => onUpdate({ status: 'downloading-audio', progress: 85 + (p * 0.10), actualQuality: quality }));

                // Stage 3: Muxing/Transcoding (Final 5%)
                onUpdate({ status: 'merging', progress: 95, actualQuality: quality });
                await muxVideoAudio(tmpV, tmpA, out,
                    (p) => onUpdate({ status: 'merging', progress: 95 + (p * 0.05), actualQuality: quality }));

                cleanupTempFiles(tmpV, tmpA);
            }
            onUpdate({ status: 'complete', progress: 100 });
        } catch (e: any) { onUpdate({ status: 'error', progress: 0, message: e.message }); }
    })();
    return jobId;
}

async function downloadThumbnail(url: string, id: string, out: string): Promise<void> {
    const tmp = path.join(TEMP_DIR, `${id}_th_${Date.now()}.jpg`);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tmp);
        (url.startsWith('https') ? https : http).get(url, (res) => {
            res.pipe(file);
            file.on('finish', () => {
                file.close();
                convertToWebp(tmp, out).then(() => { cleanupTempFiles(tmp); resolve(); }).catch(reject);
            });
        }).on('error', reject);
    });
}
