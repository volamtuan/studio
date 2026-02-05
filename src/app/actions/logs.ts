'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const logFile = path.join(process.cwd(), 'logs', 'tracking_logs.txt');

export async function getLogContentAction() {
  try {
    const content = await fs.readFile(logFile, 'utf-8');
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.writeFile(logFile, '', 'utf-8');
        return "Log file did not exist and has been created. It is currently empty.";
      } catch (writeError) {
        return "Log file does not exist and could not be created.";
      }
    }
    return "Could not read log file.";
  }
}

export async function deleteLogsAction() {
  try {
    await fs.writeFile(logFile, '');
    revalidatePath('/admin');
    return { success: true, message: 'Logs cleared successfully.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to clear logs: ${message}` };
  }
}
