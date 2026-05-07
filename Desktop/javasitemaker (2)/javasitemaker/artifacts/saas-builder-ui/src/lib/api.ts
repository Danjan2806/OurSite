import axios from "axios";

const BASE = "/api";
const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
      const current = window.location.pathname.replace(base, "") || "/";
      if (current !== "/auth") {
        localStorage.removeItem("sb_token");
        localStorage.removeItem("sb-auth");
        window.location.href = base + "/auth";
      }
    }
    return Promise.reject(error);
  }
);

export interface AuthResponse {
  token: string; userId: string; email: string;
  firstName: string; lastName: string; plan: string; role?: string; avatarUrl?: string | null;
}

export interface AdminUser {
  id: string; email: string; firstName: string; lastName: string;
  plan: string; role: string; sitesCount: number; avatarUrl?: string | null; createdAt: string;
}
export interface AdminSite {
  id: string; name: string; subdomain: string; businessType: string;
  status: string; publishedUrl: string | null; blocksCount: number;
  createdAt: string; updatedAt: string;
  frozen?: boolean; frozenReason?: string | null; frozenAt?: string | null;
  owner: { id: string; email: string; firstName: string; lastName: string } | null;
}
export interface AdminStats {
  totalUsers: number; totalSites: number; totalBlocks: number;
  publishedSites: number; draftSites: number; adminUsers: number;
  sitesByType: Record<string, number>; usersByPlan: Record<string, number>;
  registrationChart: { date: string; registrations: number }[];
}
export interface SystemInfo {
  dbSizePretty: string; dbSizeBytes: number; nodeVersion: string;
  platform: string; uptime: number; memoryMb: number; env: string;
}

export interface Block {
  id: string; type: string; position: number;
  content: string; styles: string; visible: boolean;
  width: number; rowId?: string | null; pageId?: string | null;
  createdAt: string;
}

export interface Page {
  id: string; siteId: string; name: string; slug: string; position: number; meta: string; createdAt: string;
}

export interface FormSubmission {
  id: number; siteId: string; blockId: string | null; formTitle: string;
  data: string; submitterIp: string | null; createdAt: string;
}

export interface Site {
  id: string; name: string; subdomain: string; businessType: string;
  status: string; publishedUrl: string | null; globalStyles: string;
  blocks: Block[]; pages: Page[]; createdAt: string; updatedAt: string;
  frozen?: boolean; frozenReason?: string | null;
}

export interface Stats {
  views: number; uniqueVisitors: number; clicks: number;
  newRegistrations: number; avgSessionSec: number; bounceRate: number;
  period: string; dbUsedMb: number; dbTotalMb: number;
  chartData: { date: string; views: number; clicks: number; visitors: number }[];
}

export interface UserSettings {
  theme: string; notifications: boolean; emailNotifications?: boolean;
  avatarUrl?: string | null; dbAccessLocked?: boolean; dbLockReason?: string | null;
}

export interface GlobalSeoSettings {
  gtmId?: string;
  ga4Id?: string;
  defaultAuthor?: string;
  defaultOgImage?: string;
  robotsPolicy?: "index" | "noindex";
  organizationName?: string;
  organizationLogo?: string;
}
export interface TicketResponse { ticketId: string; userId: string; status: string; createdAt: string; }

export interface ChatMessage {
  id: number; fromUserId: string; toUserId: string; message: string; imageUrl?: string | null; read: boolean; createdAt: string;
  fromUser?: { id: string; firstName: string; lastName: string; role: string } | null;
}
export interface ChatConversation {
  id: string; firstName: string; lastName: string; email: string; role: string; unread: number;
  ticketId?: string | null; shortUserId?: string;
}
export interface SupportThreadResponse {
  messages: ChatMessage[];
  staffIds: string[];
}

export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => api.post<AuthResponse>("/auth/register", data).then(r => r.data),
  login: (data: { email: string; password: string }) => api.post<AuthResponse>("/auth/login", data).then(r => r.data),
  me: () => api.get<AuthResponse>("/auth/me").then(r => r.data),
  updateSettings: (data: Partial<UserSettings>) => api.put<UserSettings>("/auth/settings", data).then(r => r.data),
  getSettings: () => api.get<UserSettings>("/auth/settings").then(r => r.data),
  updateProfile: (data: { firstName: string; lastName: string }) => api.put<AuthResponse>("/auth/profile", data).then(r => r.data),
  updateEmail: (data: { newEmail: string; password: string }) => api.put<{ email: string }>("/auth/email", data).then(r => r.data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) => api.put<{ ok: boolean }>("/auth/password", data).then(r => r.data),
  send2FA: () => api.post<{ sent: boolean; codeForDemo: string }>("/auth/2fa/send").then(r => r.data),
  verify2FA: (code: string) => api.post<{ verified: boolean }>("/auth/2fa/verify", { code }).then(r => r.data),
  submitSupport: (data: { subject: string; message: string; category: string; imageUrl?: string | null }) => api.post<TicketResponse>("/auth/support", data).then(r => r.data),
  updateAvatar: (avatarUrl: string | null) => api.put<{ avatarUrl: string | null }>("/auth/avatar", { avatarUrl }).then(r => r.data),
  getSeoSettings: () => api.get<GlobalSeoSettings>("/auth/seo-settings").then(r => r.data),
  updateSeoSettings: (data: Partial<GlobalSeoSettings>) => api.put<GlobalSeoSettings>("/auth/seo-settings", data).then(r => r.data),
};

export const sitesApi = {
  list: () => api.get<Site[]>("/sites").then(r => r.data),
  get: (id: string) => api.get<Site>(`/sites/${id}`).then(r => r.data),
  create: (data: { name: string; subdomain?: string; businessType: string }) => api.post<Site>("/sites", data).then(r => r.data),
  delete: (id: string) => api.delete(`/sites/${id}`),
  stats: (id: string, period?: string) => api.get<Stats>(`/sites/${id}/stats?period=${period || "7d"}`).then(r => r.data),
  allStats: (period?: string) => api.get<Stats>(`/sites/stats/all?period=${period || "7d"}`).then(r => r.data),
  publish: (id: string) => api.post<{ url: string; site: Site }>(`/sites/${id}/publish`).then(r => r.data),
  updateStyles: (id: string, styles: string) => api.put<Site>(`/sites/${id}/styles`, { styles }).then(r => r.data),
  listPages: (siteId: string) => api.get<Page[]>(`/sites/${siteId}/pages`).then(r => r.data),
  addPage: (siteId: string, data: { name: string; slug?: string }) => api.post<Page>(`/sites/${siteId}/pages`, data).then(r => r.data),
  updatePage: (siteId: string, pageId: string, data: { name?: string; slug?: string; meta?: string }) => api.put<Page>(`/sites/${siteId}/pages/${pageId}`, data).then(r => r.data),
  deletePage: (siteId: string, pageId: string) => api.delete(`/sites/${siteId}/pages/${pageId}`),
  formSubmit: (siteId: string, payload: { blockId?: string; formTitle?: string; data: Record<string, string> }) => api.post(`/sites/${siteId}/form-submit`, payload).then(r => r.data),
  getFormSubmissions: (siteId: string) => api.get<FormSubmission[]>(`/sites/${siteId}/form-submissions`).then(r => r.data),
  addBlock: (siteId: string, data: { type: string; position: number; pageId?: string; rowId?: string }) => api.post<Block>(`/sites/${siteId}/blocks`, data).then(r => r.data),
  updateBlock: (siteId: string, blockId: string, data: Partial<Block>) => api.put<Block>(`/sites/${siteId}/blocks/${blockId}`, data).then(r => r.data),
  deleteBlock: (siteId: string, blockId: string) => api.delete(`/sites/${siteId}/blocks/${blockId}`),
  reorderBlocks: (siteId: string, ids: string[]) => api.put<Block[]>(`/sites/${siteId}/blocks/reorder`, { ids }).then(r => r.data),
  getPublic: (id: string) => api.get<{ site: Site; blocks: Block[]; pages: Page[] }>(`/public/sites/${id}`).then(r => r.data),
};

export const PLAN_LIMITS: Record<string, { sites: number; blocks: number; pages: number }> = {
  free: { sites: 1, blocks: 5, pages: 3 },
  pro: { sites: 10, blocks: Infinity, pages: 20 },
  business: { sites: Infinity, blocks: Infinity, pages: Infinity },
};

export interface AppNotification {
  id: number; userId: string; type: string; title: string; message: string; read: boolean; createdAt: string;
}

export const notifApi = {
  list: () => api.get<AppNotification[]>("/notifications").then(r => r.data),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count").then(r => r.data),
  readAll: () => api.put("/notifications/read-all").then(r => r.data),
  markRead: (id: number) => api.put(`/notifications/${id}/read`).then(r => r.data),
};

export const chatApi = {
  getMessages: (withUserId: string) => api.get<ChatMessage[]>(`/chat/${withUserId}`).then(r => r.data),
  sendMessage: (toUserId: string, message: string) => api.post<ChatMessage>(`/chat/${toUserId}`, { message }).then(r => r.data),
  unreadCount: () => api.get<{ count: number }>("/chat/unread-count").then(r => r.data),
  getConversations: () => api.get<ChatConversation[]>("/admin/chat/conversations").then(r => r.data),
  getSupportThread: () => api.get<SupportThreadResponse>("/chat/support-thread").then(r => r.data),
  sendToSupport: (message: string, imageUrl?: string | null) => api.post<ChatMessage>("/chat/to-support", { message, imageUrl }).then(r => r.data),
};

export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then(r => r.data),
  users: () => api.get<AdminUser[]>("/admin/users").then(r => r.data),
  sites: () => api.get<AdminSite[]>("/admin/sites").then(r => r.data),
  system: () => api.get<SystemInfo>("/admin/system").then(r => r.data),
  updateUser: (id: string, data: { plan?: string; role?: string }) => api.put<AdminUser>(`/admin/users/${id}`, data).then(r => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  deleteSite: (id: string, reason?: string) => api.delete(`/admin/sites/${id}`, { params: reason ? { reason } : {} }),
  freezeSite: (id: string, frozen: boolean, reason?: string) => api.put(`/admin/sites/${id}/freeze`, { frozen, reason }).then(r => r.data),
  sendNotification: (data: { userId: string; title: string; message: string; type?: string }) => api.post("/admin/notifications", data).then(r => r.data),
  broadcastNotification: (data: { title: string; message: string; type?: string }) => api.post("/admin/notifications/broadcast", data).then(r => r.data),
  lockUserDb: (id: string, locked: boolean, reason?: string) => api.put(`/admin/users/${id}/db-lock`, { locked, reason }).then(r => r.data),
  lockAllDb: (locked: boolean, reason?: string) => api.put("/admin/db-lock-all", { locked, reason }).then(r => r.data),
  getConversations: () => api.get<ChatConversation[]>("/admin/chat/conversations").then(r => r.data),
};

export const billingApi = {
  subscribe: (data: {
    plan: string;
    billing: "monthly" | "yearly";
    trial?: boolean;
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardHolder?: string;
  }) => api.post<{ plan: string; billing: string; message: string }>("/billing/subscribe", data).then(r => r.data),

  cancel: () => api.post<{ plan: string; message: string }>("/billing/cancel").then(r => r.data),
};

// ─── AI ─────────────────────────────────────────────
export interface AiScreenshotBlock {
  type: string;
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
}
export interface AiScreenshotResult {
  suggestedName: string;
  businessType: string;
  blocks: AiScreenshotBlock[];
}
export async function analyzeScreenshot(imageBase64: string): Promise<AiScreenshotResult> {
  const { data } = await api.post<AiScreenshotResult>("/ai/screenshot-to-site", { imageBase64 }, { timeout: 180_000 });
  return data;
}
export async function analyzeFromUrl(imageUrl: string): Promise<AiScreenshotResult> {
  const { data } = await api.post<AiScreenshotResult>("/ai/screenshot-to-site", { imageUrl });
  return data;
}
export async function analyzeFromWebsiteUrl(websiteUrl: string): Promise<AiScreenshotResult> {
  const { data } = await api.post<AiScreenshotResult>("/ai/website-to-site", { websiteUrl }, { timeout: 240_000 });
  return data;
}

// ─── Image Upload ───────────────────────────────────

/** Compress + resize an image client-side before uploading.
 *  Max dimension 1920px, JPEG quality 85 % → typical phone photo 8 MB → ~200 KB */
async function compressImage(file: File): Promise<{ blob: Blob; contentType: string }> {
  const MAX_PX = 1920;
  const QUALITY = 0.85;
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error("Canvas compression failed")); return; }
        resolve({ blob, contentType: "image/jpeg" });
      }, "image/jpeg", QUALITY);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export async function uploadVideo(file: File): Promise<string> {
  const { data } = await api.post<{ uploadURL: string; objectPath: string }>("/storage/uploads/request-url", {
    name: file.name,
    size: file.size,
    contentType: file.type,
  });
  await fetch(data.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  await api.post("/storage/uploads/finalize", { objectPath: data.objectPath });
  return `${BASE}/storage${data.objectPath}`;
}

export async function uploadImage(file: File): Promise<string> {
  // Skip compression for GIF/SVG/WebP-animated — serve as-is
  const compress = !file.type.includes("gif") && !file.type.includes("svg");
  const { blob, contentType } = compress
    ? await compressImage(file)
    : { blob: file, contentType: file.type };

  const uploadName = file.name.replace(/\.[^.]+$/, ".jpg");
  const { data } = await api.post<{ uploadURL: string; objectPath: string }>("/storage/uploads/request-url", {
    name: compress ? uploadName : file.name,
    size: blob.size,
    contentType,
  });
  await fetch(data.uploadURL, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob,
  });
  // Set owner ACL so the file is readable by the uploader
  await api.post("/storage/uploads/finalize", { objectPath: data.objectPath });
  // Return a URL that goes through our serving proxy
  return `${BASE}/storage${data.objectPath}`;
}
