
export enum View {
  HOME = 'HOME',
  GALLERY = 'GALLERY',
  LOGS = 'LOGS',
  ABOUT = 'ABOUT'
}

export enum DownloadStage {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SELECTING = 'SELECTING',
  DOWNLOADING = 'DOWNLOADING',
  COMPLETE = 'COMPLETE'
}

export interface Project {
  id: number;
  title: string;
  description: string;
  date: string;
}
