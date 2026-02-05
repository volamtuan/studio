
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configPath = path.join(process.cwd(), 'src', 'config', 'ip-links.json');

export interface IpLinkConfig {
  id: string;
  title: string;
  redirectUrl: string;
}

export async function getIpLinksAction(): Promise<IpLinkConfig[]> {
  try {
    await fs.access(configPath);
  } catch (error) {
    // If file doesn't exist, create it with an empty array
    await fs.writeFile(configPath, JSON.stringify([], null, 2), 'utf-8');
    return [];
  }

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content) as IpLinkConfig[];
  } catch (error) {
    console.error("Failed to read or parse ip links config:", error);
    return [];
  }
}

export async function saveIpLinksAction(links: IpLinkConfig[]) {
  try {
    await fs.writeFile(configPath, JSON.stringify(links, null, 2), 'utf-8');
    revalidatePath('/l', 'layout'); // Revalidate the new preview route
    return { success: true, message: 'Các liên kết đã được lưu thành công.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Không thể lưu các liên kết: ${message}` };
  }
}
