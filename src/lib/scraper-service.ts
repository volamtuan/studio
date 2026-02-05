
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Server-side Scraper Service
 * Handles the logic for generating IDs, fetching content, and managing the thread pool.
 */

interface ScraperStatus {
  isRunning: boolean;
  threads: number;
  logs: string[];
  scannedCount: number;
  savedCount: number;
  errorRate: number;
}

class ScraperService {
  private static instance: ScraperService;
  private isRunning: boolean = false;
  private threads: number = 50;
  private logs: string[] = ["System initialized. Scraper service ready."];
  private scannedCount: number = 0;
  private savedCount: number = 0;
  private errors: number = 0;
  private usedIds: Set<string> = new Set();
  private dataDir: string = path.join(process.cwd(), 'data');
  private logFile: string = path.join(process.cwd(), 'used_ids.log');

  private constructor() {
    this.init();
  }

  public static getInstance(): ScraperService {
    if (!ScraperService.instance) {
      ScraperService.instance = new ScraperService();
    }
    return ScraperService.instance;
  }

  private init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (fs.existsSync(this.logFile)) {
      const data = fs.readFileSync(this.logFile, 'utf-8');
      data.split('\n').forEach(id => {
        if (id.trim()) this.usedIds.add(id.trim());
      });
      this.log(`Loaded ${this.usedIds.size} used IDs from log.`);
    }
  }

  private log(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    this.logs.push(entry);
    if (this.logs.length > 500) this.logs.shift();
    console.log(entry);
  }

  private generateRandomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const length = Math.floor(Math.random() * (20 - 3 + 1)) + 3;
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async fetchContent(id: string): Promise<string | null> {
    const url = `https://notepad.vn/${id}`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.status === 200) {
        const html = await response.text();
        // Simple regex to extract textarea content for performance
        const match = html.match(/<textarea[^>]*id="contents"[^>]*>([\s\S]*?)<\/textarea>/i);
        if (match && match[1]) {
          const content = match[1].trim();
          if (content.length > 10) return content;
        }
      }
    } catch (e) {
      this.errors++;
    }
    return null;
  }

  private saveContent(content: string) {
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const dateDir = path.join(this.dataDir, new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    const filePath = path.join(dateDir, `${hash}.txt`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf-8');
      this.savedCount++;
      this.log(`[+] Saved: ${filePath}`);
    }
  }

  private async worker() {
    while (this.isRunning) {
      let id = this.generateRandomId();
      while (this.usedIds.has(id)) {
        id = this.generateRandomId();
      }

      this.usedIds.add(id);
      fs.appendFileSync(this.logFile, id + '\n');
      this.scannedCount++;

      const content = await this.fetchContent(id);
      if (content) {
        this.saveContent(content);
      }

      // Small delay to prevent CPU hammering
      await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
    }
  }

  public start(threads: number = 50) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.threads = threads;
    this.log(`🟢 Starting scraper with ${threads} workers...`);
    
    for (let i = 0; i < threads; i++) {
      this.worker();
    }
  }

  public stop() {
    this.isRunning = false;
    this.log(`🔴 Stopping scraper...`);
  }

  public getStatus(): ScraperStatus {
    return {
      isRunning: this.isRunning,
      threads: this.isRunning ? this.threads : 0,
      logs: [...this.logs].reverse().slice(0, 100),
      scannedCount: this.scannedCount,
      savedCount: this.savedCount,
      errorRate: this.scannedCount > 0 ? (this.errors / this.scannedCount) * 100 : 0
    };
  }

  public listFolders() {
    if (!fs.existsSync(this.dataDir)) return [];
    return fs.readdirSync(this.dataDir)
      .filter(f => fs.statSync(path.join(this.dataDir, f)).isDirectory())
      .map(folder => {
        const folderPath = path.join(this.dataDir, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.txt'));
        const size = files.reduce((acc, f) => acc + fs.statSync(path.join(folderPath, f)).size, 0);
        return {
          date: folder,
          count: files.length,
          size: (size / 1024 / 1024).toFixed(2) + ' MB'
        };
      }).sort((a, b) => b.date.localeCompare(a.date));
  }

  public listFiles(folder: string) {
    const folderPath = path.join(this.dataDir, folder);
    if (!fs.existsSync(folderPath)) return [];
    return fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.txt'))
      .map(f => {
        const stats = fs.statSync(path.join(folderPath, f));
        return {
          hash: f.replace('.txt', ''),
          length: (stats.size / 1024).toFixed(1) + 'kb',
          time: stats.mtime.toLocaleTimeString()
        };
      });
  }

  public getFileContent(folder: string, filename: string) {
    const filePath = path.join(this.dataDir, folder, filename);
    if (!fs.existsSync(filePath)) return "File not found.";
    return fs.readFileSync(filePath, 'utf-8');
  }

  public purgeFolder(folder: string) {
    const folderPath = path.join(this.dataDir, folder);
    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      this.log(`[!] Purged folder: ${folder}`);
    }
  }
}

export const scraper = ScraperService.getInstance();
