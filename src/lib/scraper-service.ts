
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Server-side Scraper Service
 * Handles the logic for generating IDs, fetching content, and managing the thread pool.
 * Updated for extreme performance and "lightweight" multi-threading simulation.
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
      try {
        const data = fs.readFileSync(this.logFile, 'utf-8');
        data.split('\n').forEach(id => {
          if (id.trim()) this.usedIds.add(id.trim());
        });
        this.log(`Loaded ${this.usedIds.size} used IDs from log.`);
      } catch (e) {
        this.log("Creating new used IDs log file.");
      }
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
    const length = Math.floor(Math.random() * (12 - 4 + 1)) + 4; // Typical notepad IDs are shorter
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
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(4000)
      });
      
      if (response.status === 200) {
        const html = await response.text();
        // The original logic looks for <textarea id="contents">
        const match = html.match(/<textarea[^>]*id="contents"[^>]*>([\s\S]*?)<\/textarea>/i);
        if (match) {
          // Decode HTML entities (basic)
          const content = match[1]
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
            
          if (content.length > 10) return content;
        }
      }
    } catch (e) {
      this.errors++;
    }
    return null;
  }

  private saveContent(content: string, id: string) {
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const dateDir = path.join(this.dataDir, new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(dateDir)) {
      fs.mkdirSync(dateDir, { recursive: true });
    }

    const filePath = path.join(dateDir, `${hash}.txt`);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf-8');
      this.savedCount++;
      this.log(`[✓] ${id}: Content saved (${(content.length/1024).toFixed(1)}kb)`);
    } else {
      this.log(`[-] ${id}: Duplicate content (already saved)`);
    }
  }

  private async worker(workerId: number) {
    while (this.isRunning) {
      let id = this.generateRandomId();
      
      // Basic collision avoidance
      let attempts = 0;
      while (this.usedIds.has(id) && attempts < 10) {
        id = this.generateRandomId();
        attempts++;
      }

      this.usedIds.add(id);
      try {
        fs.appendFileSync(this.logFile, id + '\n');
      } catch(e) {}
      
      this.scannedCount++;

      const content = await this.fetchContent(id);
      if (content) {
        this.saveContent(content, id);
      } else {
        // Log less frequently for empty hits to keep console clean
        if (this.scannedCount % 50 === 0) {
          this.log(`[*] Worker ${workerId}: Scanning... (Total: ${this.scannedCount})`);
        }
      }

      // Dynamic jitter to mimic human-like or distributed requests
      const delay = Math.random() * 800 + 200;
      await new Promise(r => setTimeout(r, delay));
    }
  }

  public start(threads: number = 50) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.threads = threads;
    this.log(`🟢 Starting scraper with ${threads} parallel workers...`);
    
    // Launch workers
    for (let i = 0; i < threads; i++) {
      this.worker(i);
    }
  }

  public stop() {
    this.isRunning = false;
    this.log(`🔴 Stopping scraper operations...`);
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
    try {
      return fs.readdirSync(this.dataDir)
        .filter(f => {
          try {
            return fs.statSync(path.join(this.dataDir, f)).isDirectory();
          } catch(e) { return false; }
        })
        .map(folder => {
          const folderPath = path.join(this.dataDir, folder);
          const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.txt'));
          const size = files.reduce((acc, f) => {
            try {
              return acc + fs.statSync(path.join(folderPath, f)).size;
            } catch(e) { return acc; }
          }, 0);
          return {
            date: folder,
            count: files.length,
            size: (size / 1024 / 1024).toFixed(2) + ' MB'
          };
        }).sort((a, b) => b.date.localeCompare(a.date));
    } catch(e) {
      return [];
    }
  }

  public listFiles(folder: string) {
    const folderPath = path.join(this.dataDir, folder);
    if (!fs.existsSync(folderPath)) return [];
    try {
      return fs.readdirSync(folderPath)
        .filter(f => f.endsWith('.txt'))
        .map(f => {
          const stats = fs.statSync(path.join(folderPath, f));
          return {
            hash: f.replace('.txt', ''),
            length: (stats.size / 1024).toFixed(1) + 'kb',
            time: stats.mtime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }).sort((a, b) => b.time.localeCompare(a.time));
    } catch(e) {
      return [];
    }
  }

  public getFileContent(folder: string, filename: string) {
    const filePath = path.join(this.dataDir, folder, filename);
    if (!fs.existsSync(filePath)) return "File not found or was deleted.";
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      return "Error reading file content.";
    }
  }

  public purgeFolder(folder: string) {
    const folderPath = path.join(this.dataDir, folder);
    if (fs.existsSync(folderPath)) {
      try {
        fs.rmSync(folderPath, { recursive: true, force: true });
        this.log(`[!] Purged folder: ${folder}`);
      } catch(e) {
        this.log(`[!] Failed to purge folder: ${folder}`);
      }
    }
  }
}

export const scraper = ScraperService.getInstance();
