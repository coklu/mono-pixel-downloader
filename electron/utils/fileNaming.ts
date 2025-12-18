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

export function generateFileName(videoId: string, format: string, quality: string): string {
    const safeVideoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
    const safeFormat = format.toLowerCase().replace(/[^a-z0-9]/g, '');
    const safeQuality = quality.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ext = format.toLowerCase();
    return `youtube_${safeVideoId}_${safeFormat}_${safeQuality}.${ext}`;
}
