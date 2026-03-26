const REGION = process.env.ZOHO_REGION || "com";
const API_BASE = `https://www.zohoapis.${REGION}/crm/v7`;
const TOKEN_URL = `https://accounts.zoho.${REGION}/oauth/v2/token`;

let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry - 60_000) return _token;

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error(`Zoho token error: ${JSON.stringify(data)}`);

  _token = data.access_token;
  _tokenExpiry = Date.now() + data.expires_in * 1000;
  return _token;
}

async function zohoFetch(path, options = {}) {
  const token = await getToken();
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    const msg = data?.message || data?.data?.[0]?.message || JSON.stringify(data);
    throw new Error(`Zoho API ${res.status}: ${msg}`);
  }
  return data;
}

export async function lookupContact(email) {
  const data = await zohoFetch(
    `/Contacts/search?criteria=(Email:equals:${encodeURIComponent(email)})`
  );
  return data?.data?.[0] || null;
}

export async function lookupLead(email) {
  const data = await zohoFetch(
    `/Leads/search?criteria=(Email:equals:${encodeURIComponent(email)})`
  );
  return data?.data?.[0] || null;
}

export async function getContactDeals(contactId) {
  const data = await zohoFetch(`/Contacts/${contactId}/Deals`);
  return data?.data || [];
}

export async function createLead(fields) {
  const data = await zohoFetch("/Leads", {
    method: "POST",
    body: JSON.stringify({ data: [fields] }),
  });
  return data?.data?.[0];
}

export async function updateRecord(module, id, fields) {
  const data = await zohoFetch(`/${module}`, {
    method: "PUT",
    body: JSON.stringify({ data: [{ id, ...fields }] }),
  });
  return data?.data?.[0];
}

export async function logActivity({ module, recordId, subject, description, type = "Call" }) {
  const data = await zohoFetch("/Tasks", {
    method: "POST",
    body: JSON.stringify({
      data: [
        {
          Subject: subject,
          Description: description,
          Status: "Completed",
          Activity_Type: type,
          $se_module: module,
          What_Id: recordId,
        },
      ],
    }),
  });
  return data?.data?.[0];
}

export async function getPipelineDeals({ stage, limit = 10 } = {}) {
  const criteria = stage
    ? `(Stage:equals:${encodeURIComponent(stage)})`
    : undefined;

  const path = criteria
    ? `/Deals/search?criteria=${criteria}&per_page=${limit}`
    : `/Deals?per_page=${limit}&sort_by=Close_Date&sort_order=asc`;

  const data = await zohoFetch(path);
  return data?.data || [];
}

export async function searchRecords(module, criteria) {
  const data = await zohoFetch(
    `/${module}/search?criteria=${encodeURIComponent(criteria)}`
  );
  return data?.data || [];
}
