
'use server';

import { scraper } from '@/lib/scraper-service';

export async function startScraperAction(threads: number) {
  scraper.start(threads);
  return { success: true };
}

export async function stopScraperAction() {
  scraper.stop();
  return { success: true };
}

export async function getScraperStatusAction() {
  return scraper.getStatus();
}

export async function getFoldersAction() {
  return scraper.listFolders();
}

export async function getFilesAction(folder: string) {
  return scraper.listFiles(folder);
}

export async function getFileContentAction(folder: string, filename: string) {
  return scraper.getFileContent(folder, filename);
}

export async function purgeFolderAction(folder: string) {
  scraper.purgeFolder(folder);
  return { success: true };
}
