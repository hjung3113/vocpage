export interface SystemItem {
  id: string;
  name: string;
  slug: string;
  is_archived: boolean;
  voc_count: number;
}

export interface MenuItem {
  id: string;
  system_id: string;
  name: string;
  slug: string;
  is_archived: boolean;
  voc_count: number;
}

export interface VocType {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  is_archived: boolean;
}

export interface UserItem {
  id: string;
  display_name: string;
  email: string;
  ad_username: string;
  role: 'user' | 'manager' | 'admin';
  is_active: boolean;
  created_at: string;
}

export async function listAdminSystems(): Promise<SystemItem[]> {
  const res = await fetch('/api/admin/systems');
  if (!res.ok) throw new Error(`listAdminSystems: ${res.status}`);
  return res.json();
}

export async function createSystem(payload: {
  name: string;
  slug: string;
}): Promise<{ system: SystemItem; menu: MenuItem }> {
  const res = await fetch('/api/admin/systems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createSystem: ${res.status}`);
  return res.json();
}

export async function updateSystem(
  id: string,
  payload: Partial<{ name: string; slug: string; is_archived: boolean }>,
): Promise<SystemItem> {
  const res = await fetch(`/api/admin/systems/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateSystem: ${res.status}`);
  return res.json();
}

export async function listAdminMenus(systemId: string): Promise<MenuItem[]> {
  const res = await fetch(`/api/admin/systems/${systemId}/menus`);
  if (!res.ok) throw new Error(`listAdminMenus: ${res.status}`);
  return res.json();
}

export async function createMenu(payload: {
  system_id: string;
  name: string;
  slug: string;
}): Promise<MenuItem> {
  const res = await fetch('/api/admin/menus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createMenu: ${res.status}`);
  return res.json();
}

export async function updateMenu(
  id: string,
  payload: Partial<{ name: string; slug: string; is_archived: boolean }>,
): Promise<MenuItem> {
  const res = await fetch(`/api/admin/menus/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateMenu: ${res.status}`);
  return res.json();
}

export async function listVocTypes(): Promise<VocType[]> {
  const res = await fetch('/api/voc-types');
  if (!res.ok) throw new Error(`listVocTypes: ${res.status}`);
  return res.json();
}

export async function createVocType(payload: {
  name: string;
  slug: string;
  color: string;
  sort_order?: number;
}): Promise<VocType> {
  const res = await fetch('/api/voc-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`createVocType: ${res.status}`);
  return res.json();
}

export async function updateVocType(
  id: string,
  payload: Partial<{
    name: string;
    slug: string;
    color: string;
    sort_order: number;
    is_archived: boolean;
  }>,
): Promise<VocType> {
  const res = await fetch(`/api/voc-types/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`updateVocType: ${res.status}`);
  return res.json();
}

export async function listAdminUsers(): Promise<UserItem[]> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) throw new Error(`listAdminUsers: ${res.status}`);
  return res.json();
}

export async function updateUser(
  id: string,
  payload: { role?: string; is_active?: boolean },
): Promise<UserItem> {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(`updateUser: ${res.status}`) as Error & { code?: string };
    err.code = (body as { code?: string }).code;
    throw err;
  }
  return res.json();
}
