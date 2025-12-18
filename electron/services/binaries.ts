import path from 'path';
import { app } from 'electron';
import fs from 'fs';

/**
 * Resolves paths for external binaries (yt-dlp, ffmpeg)
 * and ensures they are executable.
 */
export function getBinaryPath(binaryName: string): string {
    const isProd = app.isPackaged;
    const fileName = process.platform === 'win32' ? `${binaryName}.exe` : binaryName;

    // In production, binaries are in the extraResources/bin folder
    // In development, we look for them in the project root bin/ folder
    const binaryPath = isProd
        ? path.join(process.resourcesPath, 'bin', fileName)
        : path.join(app.getAppPath(), 'bin', fileName);

    console.log(`[BinaryPath] Looking for ${binaryName} at: ${binaryPath}`);

    if (fs.existsSync(binaryPath)) {
        return binaryPath;
    }

    // Fallback to system path if not found in bundled folder
    return binaryName;
}
export function getBinDir(): string {
    const isProd = app.isPackaged;
    return isProd
        ? path.join(process.resourcesPath, 'bin')
        : path.join(app.getAppPath(), 'bin');
}
