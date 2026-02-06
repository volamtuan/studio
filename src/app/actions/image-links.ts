
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'src', 'config', 'image-links.json');

export interface ImageLinkConfig {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

export async function getImageLinksAction(): Promise<ImageLinkConfig[]> {
  try {
    await fs.access(configPath);
  } catch (error) {
    // If file doesn't exist, create it with an empty array
    await fs.writeFile(configPath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const links = JSON.parse(content) as ImageLinkConfig[];
    // Add default description for old links that don't have one
    return links.map(link => ({
        ...link,
        description: link.description || 'Nhấn để xem ảnh đầy đủ.'
    }));
  } catch (error) {
    console.error("Failed to read or parse image links config:", error);
    return [];
  }
}

export async function saveImageLinksAction(links: ImageLinkConfig[]) {
  try {
    await fs.writeFile(configPath, JSON.stringify(links, null, 2), 'utf-8');
    revalidatePath('/i', 'layout'); // Revalidate the new preview route
    return { success: true, message: 'Các liên kết đã được lưu thành công.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Không thể lưu các liên kết: ${message}` };
  }
}
