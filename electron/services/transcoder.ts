import { spawn } from 'child_process';
import { getBinaryPath } from './binaries.js';

function runFFmpeg(args: string[], onProgress?: (p: number) => void): Promise<void> {
    const binary = getBinaryPath('ffmpeg');
    console.log(`[Transcoder] Running: ${binary} ${args.join(' ')}`);
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn(binary, ['-y', ...args]);
        let duration = 0;
        let stderr = '';
        ffmpeg.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            const durMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
            if (durMatch) duration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseInt(durMatch[3]);
            const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch && duration > 0 && onProgress) {
                const cur = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]);
                onProgress(Math.min((cur / duration) * 100, 100));
            }
        });
        ffmpeg.on('close', (c) => c === 0 ? resolve() : reject(new Error(`FFmpeg failed (${c}): ${stderr.split('\n').pop() || stderr}`)));
        ffmpeg.on('error', (e) => reject(new Error(`FFmpeg error: ${e.message}`)));
    });
}

export async function transcodeAudio(input: string, output: string, format: string, bitrate: string, onProgress?: (p: number) => void): Promise<void> {
    const br = parseInt(bitrate);
    const codec = format.toLowerCase() === 'mp3' ? 'libmp3lame' : format.toLowerCase() === 'opus' ? 'libopus' : 'aac';
    const args = ['-i', input, '-vn', '-acodec', codec, '-b:a', `${br}k`, '-ac', '2', output];
    await runFFmpeg(args, onProgress);
}

export async function muxVideoAudio(video: string, audio: string, output: string, onProgress?: (p: number) => void): Promise<void> {
    const args = ['-i', video, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', output];
    await runFFmpeg(args, onProgress);
}

export async function convertToWebp(input: string, output: string): Promise<void> {
    await runFFmpeg(['-i', input, '-quality', '90', output]);
}

export async function cleanupTempFiles(...files: string[]): Promise<void> {
    const fs = await import('fs');
    for (const f of files) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch { }
    }
}
