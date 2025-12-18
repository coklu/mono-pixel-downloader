import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const BIN_DIR = path.join(ROOT, 'bin');

const BINARIES = {
    'yt-dlp.exe': 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
    'ffmpeg.exe': 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip'
};

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(dest);
            response.pipe(file);
            file.on('finish', () => {
                file.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            file.on('error', (err) => {
                file.close();
                fs.unlink(dest, () => { });
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

async function setup() {
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });

    for (const [name, url] of Object.entries(BINARIES)) {
        const dest = path.join(BIN_DIR, name);
        if (fs.existsSync(dest)) {
            console.log(`[Setup] ${name} already exists, skipping...`);
            continue;
        }

        console.log(`[Setup] Downloading ${name}...`);
        if (name === 'ffmpeg.exe') {
            const zipDest = path.join(BIN_DIR, 'ffmpeg.zip');
            await downloadFile(url, zipDest);
            console.log(`[Setup] Unzipping FFmpeg (this may take a moment)...`);
            // Simple approach: look for ffmpeg.exe in the zip and extract it
            // We use powershell's Expand-Archive for simplicity on Windows
            try {
                execSync(`powershell -command "Expand-Archive -Path '${zipDest}' -DestinationPath '${BIN_DIR}/temp' -Force"`);
                const ffmpegPath = execSync(`powershell -command "(Get-ChildItem -Path '${BIN_DIR}/temp' -Filter 'ffmpeg.exe' -Recurse).FullName"`).toString().trim();
                fs.copyFileSync(ffmpegPath, dest);
                execSync(`powershell -command "Remove-Item -Path '${BIN_DIR}/temp' -Recurse -Force"`);
                fs.unlinkSync(zipDest);
            } catch (e) {
                console.error(`[Setup] Failed to extract FFmpeg: ${e.message}`);
            }
        } else {
            await downloadFile(url, dest);
        }
        console.log(`[Setup] ${name} downloaded successfully.`);
    }
}

setup().catch(console.error);
