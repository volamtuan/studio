
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'src', 'config', 'cloaked-links.json');

export interface CloakedLinkConfig {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  redirectUrl: string;
}

export async function getCloakedLinksAction(): Promise<CloakedLinkConfig[]> {
  try {
    await fs.access(configPath);
  } catch (error) {
    // If file doesn't exist, create it with an empty array
    await fs.writeFile(configPath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as CloakedLinkConfig[];
  } catch (error) {
    console.error("Failed to read or parse cloaked links config:", error);
    return [];
  }
}

export async function saveCloakedLinksAction(links: CloakedLinkConfig[]) {
  try {
    await fs.writeFile(configPath, JSON.stringify(links, null, 2), 'utf-8');
    revalidatePath('/r', 'layout'); 
    return { success: true, message: 'Các liên kết đã được lưu thành công.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Không thể lưu các liên kết: ${message}` };
  }
}
