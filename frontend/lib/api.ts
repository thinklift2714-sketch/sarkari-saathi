/**
 * API Client for Sarkari Saathi Frontend -> FastAPI Backend
 * Includes Bearer token authentication header for user data isolation.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sarkari_saathi_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
}

export async function saveProfile(data: any) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}

export async function addFamilyMember(member: {
  name: string;
  relationship: string;
  age: number;
  occupation: string;
}) {
  const res = await fetch(`${API_BASE}/profile/members`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(member),
  });
  if (!res.ok) throw new Error("Failed to add member");
  return res.json();
}

export async function removeFamilyMember(memberId: string) {
  const res = await fetch(`${API_BASE}/profile/members/${memberId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove member");
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/schemes/categories`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json();
}

export async function discoverSchemes(params?: {
  profile?: any;
  session_id?: string;
  category?: string;
  search_query?: string;
  government_level?: string;
}) {
  const res = await fetch(`${API_BASE}/schemes/discover`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) throw new Error("Failed to discover schemes");
  return res.json();
}

export async function fetchSchemes(state?: string) {
  const url = state
    ? `${API_BASE}/schemes?state=${encodeURIComponent(state)}`
    : `${API_BASE}/schemes`;
  const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load schemes");
  return res.json();
}

export async function fetchScheme(id: string) {
  const res = await fetch(`${API_BASE}/schemes/${id}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load scheme details");
  return res.json();
}

export async function evaluateEligibility(customProfile?: any) {
  const res = await fetch(`${API_BASE}/eligibility/evaluate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: customProfile ? JSON.stringify(customProfile) : undefined,
  });
  if (!res.ok) throw new Error("Failed to evaluate eligibility");
  return res.json();
}

export async function fetchDocumentChecklist(schemeId: string = "scheme_up_widow_pension") {
  const res = await fetch(`${API_BASE}/documents/checklist/${schemeId}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load checklist");
  return res.json();
}

export async function updateDocumentStatus(
  documentName: string,
  status: "available" | "missing" | "uploaded"
) {
  const res = await fetch(`${API_BASE}/documents/status`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ document_name: documentName, status }),
  });
  if (!res.ok) throw new Error("Failed to update document status");
  return res.json();
}

export async function fetchApplications() {
  const res = await fetch(`${API_BASE}/applications`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load applications");
  return res.json();
}

export async function submitApplication(schemeId: string, ref?: string) {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ scheme_id: schemeId, application_reference: ref }),
  });
  if (!res.ok) throw new Error("Failed to submit application");
  return res.json();
}

export async function sendChatMessage(
  message: string,
  history: any[] = [],
  currentProfile?: any,
  conversationId?: string
) {
  const res = await fetch(`${API_BASE}/conversation/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      history,
      current_profile: currentProfile,
      conversation_id: conversationId,
    }),
  });
  if (!res.ok) throw new Error("Conversation failed");
  return res.json();
}

// =====================================================================
// SAVED SCHEMES APIS (User-Isolated)
// =====================================================================

export async function fetchSavedSchemes() {
  const res = await fetch(`${API_BASE}/schemes/saved`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchSavedSchemeIds(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/schemes/saved/ids`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function saveScheme(schemeId: string) {
  const res = await fetch(`${API_BASE}/schemes/saved/${schemeId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to save scheme");
  return res.json();
}

export async function removeSavedScheme(schemeId: string) {
  const res = await fetch(`${API_BASE}/schemes/saved/${schemeId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to remove saved scheme");
  return res.json();
}

// =====================================================================
// CONVERSATIONS & CHAT HISTORY APIS (Persistent)
// =====================================================================

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/conversation`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return [];
  return res.json();
}

export async function createConversation(title?: string) {
  const res = await fetch(`${API_BASE}/conversation`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to create conversation");
  return res.json();
}

export async function fetchConversation(conversationId: string) {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch conversation");
  return res.json();
}

export async function deleteConversation(conversationId: string) {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete conversation");
  return res.json();
}

export async function renameConversation(conversationId: string, title: string) {
  const res = await fetch(`${API_BASE}/conversation/${conversationId}`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error("Failed to rename conversation");
  return res.json();
}

export async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("sarkari_saathi_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}/voice/transcribe`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error("Transcription failed");
  return res.json();
}

export async function fetchIntegrationsStatus() {
  const res = await fetch(`${API_BASE}/integrations/status`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load integrations status");
  return res.json();
}

export async function triggerSync(sourceId?: string) {
  const res = await fetch(`${API_BASE}/integrations/sync`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ source_id: sourceId }),
  });
  if (!res.ok) throw new Error("Sync failed");
  return res.json();
}

export async function startSchemeAnalysis(params: {
  userInput?: string;
  profile?: any;
  sessionId?: string;
}) {
  const res = await fetch(`${API_BASE}/schemes/analyze`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      user_input: params.userInput || "",
      profile: params.profile,
      session_id: params.sessionId,
    }),
  });
  if (!res.ok) throw new Error("Failed to start analysis");
  return res.json();
}

export function getAnalysisProgressStreamUrl(analysisId: string): string {
  return `${API_BASE}/schemes/analyze/${analysisId}/progress`;
}

export async function fetchAnalysisResult(analysisId: string) {
  const res = await fetch(`${API_BASE}/schemes/analyze/${analysisId}/result`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch analysis result");
  return res.json();
}

// =====================================================================
// APPLICATION GUIDE & ADMIN GOVERNANCE APIs
// =====================================================================

export async function fetchApplicationGuide(schemeId: string) {
  const res = await fetch(`${API_BASE}/applications/guide/${encodeURIComponent(schemeId)}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load application guide");
  return res.json();
}

export async function fetchAdminSchemes(params?: {
  category?: string;
  status?: string;
  search?: string;
}) {
  const q = new URLSearchParams();
  if (params?.category && params.category !== "all") q.set("category", params.category);
  if (params?.status && params.status !== "all") q.set("status", params.status);
  if (params?.search) q.set("search", params.search);

  const url = `${API_BASE}/admin/schemes${q.toString() ? `?${q.toString()}` : ""}`;
  const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load admin schemes");
  return res.json();
}

export async function fetchAdminScheme(schemeId: string) {
  const res = await fetch(`${API_BASE}/admin/schemes/${encodeURIComponent(schemeId)}`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch scheme");
  return res.json();
}

export async function createAdminScheme(schemeData: any) {
  const res = await fetch(`${API_BASE}/admin/schemes`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(schemeData),
  });
  if (!res.ok) throw new Error("Failed to create scheme");
  return res.json();
}

export async function updateAdminScheme(schemeId: string, updates: any) {
  const res = await fetch(`${API_BASE}/admin/schemes/${encodeURIComponent(schemeId)}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update scheme");
  return res.json();
}

export async function deleteAdminScheme(schemeId: string) {
  const res = await fetch(`${API_BASE}/admin/schemes/${encodeURIComponent(schemeId)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to delete scheme");
  return res.json();
}

export async function verifyAdminScheme(schemeId: string, verifierName: string = "Admin", notes?: string) {
  const res = await fetch(`${API_BASE}/admin/schemes/${encodeURIComponent(schemeId)}/verify`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ verifier_name: verifierName, notes }),
  });
  if (!res.ok) throw new Error("Failed to verify scheme");
  return res.json();
}

export async function fetchAdminSyncStatus() {
  const res = await fetch(`${API_BASE}/admin/sync/status`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load sync status");
  return res.json();
}

export async function triggerAdminSync(sourceId?: string) {
  const url = sourceId
    ? `${API_BASE}/admin/sync/trigger?source_id=${encodeURIComponent(sourceId)}`
    : `${API_BASE}/admin/sync/trigger`;
  const res = await fetch(url, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to trigger sync");
  return res.json();
}

export async function fetchAdminSyncLogs() {
  const res = await fetch(`${API_BASE}/admin/sync/logs`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load sync logs");
  return res.json();
}
