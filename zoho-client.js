// src/zoho-client.js
// Thin wrapper around the Zoho CRM v7 REST API

import axios from "axios";
import { getAccessToken } from "./auth.js";

const REGION = process.env.ZOHO_REGION || "com";
const API_BASE =
  process.env.ZOHO_API_BASE || `https://www.zohoapis.${REGION}/crm/v7`;

async function buildHeaders() {
  const token = await getAccessToken();
  return {
    Authorization: `Zoho-oauthtoken ${token}`,
    "Content-Type": "application/json",
  };
}

function handleZohoError(err) {
  if (err.response) {
    const data = err.response.data;
    const status = err.response.status;
    const message =
      data?.message ||
      data?.data?.[0]?.message ||
      JSON.stringify(data);
    throw new Error(`Zoho API error (HTTP ${status}): ${message}`);
  }
  throw err;
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Create one or more records in a module.
 * @param {string} module - e.g. "Leads", "Contacts", "Deals"
 * @param {object[]} records - Array of field objects
 */
export async function createRecords(module, records) {
  try {
    const headers = await buildHeaders();
    const res = await axios.post(
      `${API_BASE}/${module}`,
      { data: records },
      { headers }
    );
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * Get a single record by ID.
 * @param {string} module
 * @param {string} recordId
 * @param {string[]} [fields] - Optional field list to return
 */
export async function getRecord(module, recordId, fields = []) {
  try {
    const headers = await buildHeaders();
    const params = fields.length ? { fields: fields.join(",") } : {};
    const res = await axios.get(`${API_BASE}/${module}/${recordId}`, {
      headers,
      params,
    });
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * List records from a module with optional sorting and pagination.
 * @param {string} module
 * @param {object} options - { page, per_page, sort_by, sort_order, fields }
 */
export async function listRecords(module, options = {}) {
  try {
    const headers = await buildHeaders();
    const params = {
      page: options.page || 1,
      per_page: options.per_page || 20,
      ...(options.sort_by && { sort_by: options.sort_by }),
      ...(options.sort_order && { sort_order: options.sort_order }),
      ...(options.fields && { fields: options.fields.join(",") }),
    };
    const res = await axios.get(`${API_BASE}/${module}`, { headers, params });
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * Search records using Zoho COQL or criteria.
 * @param {string} module
 * @param {string} criteria - Zoho search criteria e.g. "(Last_Name:equals:Smith)"
 * @param {object} options - { page, per_page, fields }
 */
export async function searchRecords(module, criteria, options = {}) {
  try {
    const headers = await buildHeaders();
    const params = {
      criteria,
      page: options.page || 1,
      per_page: options.per_page || 20,
      ...(options.fields && { fields: options.fields.join(",") }),
    };
    const res = await axios.get(`${API_BASE}/${module}/search`, {
      headers,
      params,
    });
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * Update one or more existing records.
 * @param {string} module
 * @param {object[]} records - Each must include an "id" field
 */
export async function updateRecords(module, records) {
  try {
    const headers = await buildHeaders();
    const res = await axios.put(
      `${API_BASE}/${module}`,
      { data: records },
      { headers }
    );
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * Delete one or more records by ID.
 * @param {string} module
 * @param {string[]} recordIds
 */
export async function deleteRecords(module, recordIds) {
  try {
    const headers = await buildHeaders();
    const res = await axios.delete(`${API_BASE}/${module}`, {
      headers,
      params: { ids: recordIds.join(",") },
    });
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * List all available CRM modules.
 */
export async function listModules() {
  try {
    const headers = await buildHeaders();
    const res = await axios.get(`${API_BASE}/settings/modules`, { headers });
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}

/**
 * Get field metadata for a module.
 * @param {string} module
 */
export async function getModuleFields(module) {
  try {
    const headers = await buildHeaders();
    const res = await axios.get(`${API_BASE}/settings/fields`, {
      headers,
      params: { module },
    });
    return res.data;
  } catch (err) {
    handleZohoError(err);
  }
}
