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
  history: any[],
  currentProfile?: any
) {
  const res = await fetch(`${API_BASE}/conversation/message`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ message, history, current_profile: currentProfile }),
  });
  if (!res.ok) throw new Error("Conversation failed");
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
