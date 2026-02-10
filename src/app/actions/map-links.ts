
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'src', 'config', 'map-links.json');

export interface MapLinkConfig {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export async function getMapLinksAction(): Promise<MapLinkConfig[]> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as MapLinkConfig[];
  } catch (error) {
    // If file doesn't exist, return an empty array.
    // File will be created on the next save.
    return [];
  }
}

export async function saveMapLinksAction(links: MapLinkConfig[]) {
  try {
    const configDir = path.dirname(configPath);
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(links, null, 2), 'utf-8');
    // Revalidate the path where these links are used
    revalidatePath('/map-preview', 'layout');
    return { success: true, message: 'Các liên kết đã được lưu thành công.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Không thể lưu các liên kết: ${message}` };
  }
}
