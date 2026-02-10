
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { getCurrentUserAction } from '@/app/actions/users';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

// Function to ensure the uploads directory exists
async function ensureUploadsDirExists() {
  try {
    // Using fs.access to check for existence and permissions
    await fs.access(uploadsDir);
  } catch (error) {
    // If it doesn't exist, create it
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (mkdirError) {
        console.error("Failed to create upload directory:", mkdirError);
        // This is a critical server error, throw it to be caught by the main try-catch
        throw new Error('Server error: Could not prepare upload directory.');
      }
    } else {
      // For other errors (like permission denied), re-throw
      throw error;
    }
  }
}

export async function uploadFileAction(formData: FormData): Promise<{ success: true, url: string } | { success: false, message: string }> {
  try {
    const user = await getCurrentUserAction();
    if (!user) {
      return { success: false, message: 'Truy cập bị từ chối: Yêu cầu đăng nhập.' };
    }

    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return { success: false, message: 'Không có tệp nào được cung cấp.' };
    }

    if (!file.type.startsWith('image/')) {
      return { success: false, message: 'Loại tệp không hợp lệ. Chỉ cho phép tệp ảnh.' };
    }

    const MAX_FILE_SIZE_MB = 5;
    if (file.size > 1024 * 1024 * MAX_FILE_SIZE_MB) {
      return { success: false, message: `Tệp quá lớn. Kích thước tối đa là ${MAX_FILE_SIZE_MB}MB.` };
    }

    await ensureUploadsDirExists();
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileExtension = path.extname(file.name) || '.jpg';
    const fileName = `${crypto.randomUUID()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;
    
    // Revalidate the entire site to ensure the new static file is recognized
    revalidatePath('/', 'layout');
    
    return { success: true, url: fileUrl };
  } catch (error) {
    console.error("Error in uploadFileAction:", error);
    const message = error instanceof Error ? error.message : 'Đã xảy ra lỗi không xác định trên máy chủ.';
    return { success: false, message };
  }
}
