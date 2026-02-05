'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'src', 'config', 'pixel-links.json');

export interface PixelLinkConfig {
  id: string;
  title: string;
  imageUrl: string;
}

export async function getPixelLinksAction(): Promise<PixelLinkConfig[]> {
  try {
    await fs.access(configPath);
  } catch (error) {
    // If file doesn't exist, create it with an empty array
    await fs.writeFile(configPath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as PixelLinkConfig[];
  } catch (error) {
    console.error("Failed to read or parse pixel links config:", error);
    return [];
  }
}

export async function savePixelLinksAction(links: PixelLinkConfig[]) {
  try {
    await fs.writeFile(configPath, JSON.stringify(links, null, 2), 'utf-8');
    revalidatePath('/pixel-tracker');
    return { success: true, message: 'Các pixel theo dõi đã được lưu thành công.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Không thể lưu các pixel: ${message}` };
  }
}
