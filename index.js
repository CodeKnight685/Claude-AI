// src/index.js
// Zoho CRM MCP Server — exposes CRUD tools via the Model Context Protocol

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import {
  createRecords,
  getRecord,
  listRecords,
  searchRecords,
  updateRecords,
  deleteRecords,
  listModules,
  getModuleFields,
} from "./zoho-client.js";

// ─── Server Setup ─────────────────────────────────────────────────────────────

const server = new McpServer({
  name: "zoho-crm",
  version: "1.0.0",
  description: "Perform CRUD operations on Zoho CRM records",
});

// ─── Tool: list_modules ───────────────────────────────────────────────────────

server.tool(
  "list_modules",
  "List all available Zoho CRM modules (e.g. Leads, Contacts, Deals, Accounts)",
  {},
  async () => {
    const data = await listModules();
    const modules = (data.modules || []).map((m) => ({
      api_name: m.api_name,
      singular_label: m.singular_label,
      plural_label: m.plural_label,
      module_name: m.module_name,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(modules, null, 2) }],
    };
  }
);

// ─── Tool: get_module_fields ──────────────────────────────────────────────────

server.tool(
  "get_module_fields",
  "Get all field definitions for a Zoho CRM module. Use this to know which fields are available before creating or updating records.",
  { module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals") },
  async ({ module }) => {
    const data = await getModuleFields(module);
    const fields = (data.fields || []).map((f) => ({
      api_name: f.api_name,
      field_label: f.field_label,
      data_type: f.data_type,
      required: f.system_mandatory || false,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(fields, null, 2) }],
    };
  }
);

// ─── Tool: create_record ──────────────────────────────────────────────────────

server.tool(
  "create_record",
  "Create a new record in a Zoho CRM module. Pass field values as a JSON object.",
  {
    module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals"),
    fields: z
      .record(z.any())
      .describe(
        'Record fields as key-value pairs, e.g. { "Last_Name": "Smith", "Email": "smith@example.com" }'
      ),
  },
  async ({ module, fields }) => {
    const data = await createRecords(module, [fields]);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Tool: get_record ─────────────────────────────────────────────────────────

server.tool(
  "get_record",
  "Fetch a single Zoho CRM record by its ID.",
  {
    module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals"),
    record_id: z.string().describe("The Zoho record ID"),
    fields: z
      .array(z.string())
      .optional()
      .describe("Optional list of field API names to return"),
  },
  async ({ module, record_id, fields }) => {
    const data = await getRecord(module, record_id, fields || []);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Tool: list_records ───────────────────────────────────────────────────────

server.tool(
  "list_records",
  "List records from a Zoho CRM module with optional pagination and sorting.",
  {
    module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals"),
    page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
    per_page: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Records per page, max 200 (default: 20)"),
    sort_by: z.string().optional().describe("Field API name to sort by"),
    sort_order: z
      .enum(["asc", "desc"])
      .optional()
      .describe("Sort direction (asc or desc)"),
    fields: z
      .array(z.string())
      .optional()
      .describe("Optional list of field API names to return"),
  },
  async ({ module, page, per_page, sort_by, sort_order, fields }) => {
    const data = await listRecords(module, {
      page,
      per_page,
      sort_by,
      sort_order,
      fields,
    });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Tool: search_records ─────────────────────────────────────────────────────

server.tool(
  "search_records",
  `Search Zoho CRM records using criteria syntax.
Criteria format: (field_api_name:operator:value)
Operators: equals, not_equal, starts_with, ends_with, contains, not_contains, greater_than, less_than, greater_equal, less_equal, between, not_between, in, not_in
Combine with 'and'/'or': ((Last_Name:equals:Smith)and(Email:starts_with:john))`,
  {
    module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals"),
    criteria: z
      .string()
      .describe(
        'Zoho search criteria, e.g. "(Last_Name:equals:Smith)" or "((Email:starts_with:john)and(Lead_Status:equals:New))"'
      ),
    page: z.number().int().min(1).optional().describe("Page number (default: 1)"),
    per_page: z
      .number()
      .int()
      .min(1)
      .max(200)
      .optional()
      .describe("Records per page (default: 20)"),
    fields: z
      .array(z.string())
      .optional()
      .describe("Optional list of field API names to return"),
  },
  async ({ module, criteria, page, per_page, fields }) => {
    const data = await searchRecords(module, criteria, { page, per_page, fields });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Tool: update_record ──────────────────────────────────────────────────────

server.tool(
  "update_record",
  "Update fields on an existing Zoho CRM record by its ID.",
  {
    module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals"),
    record_id: z.string().describe("The Zoho record ID to update"),
    fields: z
      .record(z.any())
      .describe(
        'Fields to update as key-value pairs, e.g. { "Lead_Status": "Qualified", "Phone": "+1-555-0000" }'
      ),
  },
  async ({ module, record_id, fields }) => {
    const data = await updateRecords(module, [{ id: record_id, ...fields }]);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Tool: delete_record ──────────────────────────────────────────────────────

server.tool(
  "delete_record",
  "Delete one or more records from a Zoho CRM module by their IDs.",
  {
    module: z.string().describe("Module API name, e.g. Leads, Contacts, Deals"),
    record_ids: z
      .array(z.string())
      .min(1)
      .max(100)
      .describe("Array of record IDs to delete (max 100)"),
  },
  async ({ module, record_ids }) => {
    const data = await deleteRecords(module, record_ids);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    };
  }
);

// ─── Start Server ─────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Zoho CRM MCP server running on stdio");
