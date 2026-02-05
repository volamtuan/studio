
'use server';

import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { revalidatePath } from 'next/cache';

const usersConfigPath = path.join(process.cwd(), 'src', 'config', 'users.json');

export type UserPermission = 'admin' | 'map_links' | 'image_links' | 'ip_links' | 'file_creator' | 'link_cloaker' | 'qr_creator';

export interface User {
  username: string;
  passwordHash: string;
  permissions: UserPermission[];
}

async function readUsers(): Promise<User[]> {
  try {
    const fileContent = await fs.readFile(usersConfigPath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // If the file doesn't exist, create it with the default admin user
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

// Action to authenticate a user
export async function loginAction(username: string, password_raw: string) {
  const users = await readUsers();
  const passwordHash = hashPassword(password_raw);
  
  const user = users.find(u => u.username === username);

  if (user && user.passwordHash === passwordHash) {
    const { passwordHash: _, ...userToReturn } = user;
    return { success: true, user: userToReturn };
  }
  
  return { success: false, message: 'Tên đăng nhập hoặc mật khẩu không hợp lệ.' };
}

// Action to get all users (without password hashes)
export async function getUsersAction() {
  const users = await readUsers();
  return users.map(u => {
    const { passwordHash, ...user } = u;
    return user;
  });
}

// Action to add a new user
export async function addUserAction(formData: FormData) {
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

// Action to update user permissions
export async function updateUserAction(formData: FormData) {
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

    // Prevent changing admin user's permissions away from 'admin'
    if (users[userIndex].permissions.includes('admin')) {
        return { success: false, message: 'Không thể thay đổi quyền của quản trị viên.' };
    }

    users[userIndex].permissions = permissions;
    await writeUsers(users);
    
    return { success: true, message: `Quyền của người dùng '${username}' đã được cập nhật.` };
}


// Action to update admin password
export async function updateAdminPasswordAction(formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const adminUsername = "vlt"; // Assuming 'vlt' is the admin

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

    // Update password
    users = users.map(u => u.username === adminUsername ? { ...u, passwordHash: hashPassword(newPassword) } : u);
    await writeUsers(users);

    return { success: true, message: "Mật khẩu quản trị đã được cập nhật thành công." };
}

// Action to delete a user
export async function deleteUserAction(username: string) {
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
