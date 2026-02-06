
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

const usersConfigPath = path.join(process.cwd(), 'src', 'config', 'users.json');

export type UserPermission = 'admin' | 'map_links' | 'image_links' | 'ip_links' | 'file_creator' | 'link_cloaker' | 'pixel_tracker';

export interface User {
  username: string;
  passwordHash: string;
  permissions: UserPermission[];
}

export type SessionPayload = Omit<User, 'passwordHash'>;

// This secret should be moved to an environment variable in a real production app.
const SESSION_SECRET = "a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3";

async function createSession(payload: SessionPayload, remember: boolean) {
    const sessionData = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', SESSION_SECRET).update(sessionData).digest('hex');
    const token = `${Buffer.from(sessionData).toString('base64')}.${signature}`;

    cookies().set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: remember ? 60 * 60 * 24 * 30 : undefined, // 30 days or session
        path: '/',
        sameSite: 'lax',
    });
}

export async function getCurrentUserAction(): Promise<SessionPayload | null> {
    const token = cookies().get('session')?.value;
    if (!token) return null;

    try {
        const [encodedPayload, signature] = token.split('.');
        if (!encodedPayload || !signature) return null;

        const sessionData = Buffer.from(encodedPayload, 'base64').toString('utf-8');
        const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(sessionData).digest('hex');

        // Use timingSafeEqual to prevent timing attacks
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            const payload = JSON.parse(sessionData);
            return payload as SessionPayload;
        }
    } catch (e) {
        // Errors in parsing/verification mean an invalid token
        return null;
    }

    return null;
}

export async function logoutAction() {
    cookies().delete('session');
    return { success: true };
}

async function readUsers(): Promise<User[]> {
  try {
    const fileContent = await fs.readFile(usersConfigPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaultAdminPassword = "123";
      const passwordHash = crypto.createHash('sha256').update(defaultAdminPassword).digest('hex');
      const defaultUser: User[] = [{
        username: "vlt",
        passwordHash: passwordHash,
        permissions: ["admin"]
      }];
      await fs.writeFile(usersConfigPath, JSON.stringify(defaultUser, null, 2), 'utf-8');
      return defaultUser;
    }
    console.error("Failed to read users file:", error);
    return [];
  }
}

async function writeUsers(users: User[]) {
  await fs.writeFile(usersConfigPath, JSON.stringify(users, null, 2), 'utf-8');
  revalidatePath('/users');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function loginAction(formData: FormData): Promise<{ success: true; user: SessionPayload } | { success: false; message: string }> {
  const username = formData.get('username') as string;
  const password_raw = formData.get('password') as string;
  const remember = formData.get('remember') === 'on';

  const users = await readUsers();
  const passwordHash = hashPassword(password_raw);
  
  const user = users.find(u => u.username === username);

  if (user && user.passwordHash === passwordHash) {
    if (user.permissions.length === 0) {
      return { success: false, message: 'Tài khoản của bạn không có quyền truy cập. Vui lòng liên hệ quản trị viên.' };
    }
    const { passwordHash: _, ...userToReturn } = user;
    await createSession(userToReturn, remember);
    return { success: true, user: userToReturn };
  }
  
  return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ.' };
}

export async function getUsersAction(): Promise<SessionPayload[]> {
  const users = await readUsers();
  return users.map(u => {
    const { passwordHash, ...user } = u;
    return user;
  });
}

export async function addUserAction(formData: FormData) {
  const session = await getCurrentUserAction();
  if (!session?.permissions.includes('admin')) {
    return { success: false, message: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên.' };
  }

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const permissions = formData.getAll('permissions') as UserPermission[];

  if (!username || !password) {
    return { success: false, message: 'Tên người dùng và mật khẩu là bắt buộc.' };
  }
  
  const users = await readUsers();
  if (users.some(u => u.username === username)) {
    return { success: false, message: 'Tên người dùng đã tồn tại.' };
  }

  const newUser: User = {
    username,
    passwordHash: hashPassword(password),
    permissions: permissions,
  };

  users.push(newUser);
  await writeUsers(users);
  return { success: true, message: 'Người dùng đã được tạo thành công.' };
}

export async function updateUserAction(formData: FormData) {
    const session = await getCurrentUserAction();
    if (!session?.permissions.includes('admin')) {
        return { success: false, message: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên.' };
    }

    const username = formData.get('username') as string;
    const permissions = formData.getAll('permissions') as UserPermission[];

    if (!username) {
        return { success: false, message: 'Tên người dùng không hợp lệ.' };
    }

    let users = await readUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return { success: false, message: 'Không tìm thấy người dùng.' };
    }

    if (users[userIndex].permissions.includes('admin')) {
        return { success: false, message: 'Không thể thay đổi quyền của quản trị viên.' };
    }

    users[userIndex].permissions = permissions;
    await writeUsers(users);
    
    return { success: true, message: `Quyền của người dùng '${username}' đã được cập nhật.` };
}

export async function updateAdminPasswordAction(formData: FormData) {
    const session = await getCurrentUserAction();
    if (!session?.permissions.includes('admin')) {
        return { success: false, message: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên.' };
    }

    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const adminUsername = "vlt"; 

    if (!currentPassword || !newPassword) {
        return { success: false, message: "Vui lòng nhập đầy đủ mật khẩu." };
    }
    
    let users = await readUsers();
    const adminUser = users.find(u => u.username === adminUsername);

    if (!adminUser) {
        return { success: false, message: "Không tìm thấy tài khoản quản trị." };
    }

    if (adminUser.passwordHash !== hashPassword(currentPassword)) {
        return { success: false, message: "Mật khẩu hiện tại không chính xác." };
    }

    users = users.map(u => u.username === adminUsername ? { ...u, passwordHash: hashPassword(newPassword) } : u);
    await writeUsers(users);

    return { success: true, message: "Mật khẩu quản trị đã được cập nhật thành công." };
}

export async function deleteUserAction(username: string) {
    const session = await getCurrentUserAction();
    if (!session?.permissions.includes('admin')) {
        return { success: false, message: 'Truy cập bị từ chối: Yêu cầu quyền quản trị viên.' };
    }

    if (username === 'vlt') {
        return { success: false, message: 'Không thể xóa tài khoản quản trị viên gốc.' };
    }
    let users = await readUsers();
    const initialLength = users.length;
    users = users.filter(u => u.username !== username);

    if (users.length === initialLength) {
        return { success: false, message: 'Không tìm thấy người dùng.' };
    }
    
    await writeUsers(users);
    return { success: true, message: 'Người dùng đã được xóa.' };
}
