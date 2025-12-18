export function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

export function isValidYouTubeUrl(url: string): boolean {
    return extractVideoId(url) !== null;
}

export function sanitizeFilename(filename: string): string {
    return filename.replace(/[<>:"/\\|?*]/g, '_').trim();
}

export function generateFileName(videoId: string, format: string, quality: string, title?: string): string {
    const safeTitle = title ? sanitizeFilename(title) : `youtube_${videoId}`;
    const safeFormat = format.toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeQuality = quality.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext = format.toLowerCase();
    return `${safeTitle}_${safeQuality}.${ext}`;
}
