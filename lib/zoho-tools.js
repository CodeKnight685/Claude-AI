import {
  lookupContact,
  lookupLead,
  getContactDeals,
  createLead,
  updateRecord,
  logActivity,
  getPipelineDeals,
  searchRecords,
} from "./zoho-crm.js";

export const ZOHO_TOOLS = [
  {
    name: "lookup_contact_by_email",
    description: "Look up a Zoho CRM Contact or Lead by email address. Returns name, phone, company, lead status, and linked deals.",
    input_schema: {
      type: "object",
      properties: {
        email: { type: "string", description: "The customer's email address" },
      },
      required: ["email"],
    },
  },
  {
    name: "get_customer_deals",
    description: "Fetch open deals linked to a CRM contact. Returns deal names, stages, amounts, and close dates.",
    input_schema: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "The Zoho CRM Contact ID" },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "create_lead",
    description: "Create a new Lead in Zoho CRM from the conversation.",
    input_schema: {
      type: "object",
      properties: {
        first_name: { type: "string" },
        last_name: { type: "string", description: "Required by Zoho CRM" },
        email: { type: "string" },
        phone: { type: "string" },
        company: { type: "string" },
        lead_source: { type: "string", default: "Chat" },
        description: { type: "string", description: "Summary of the customer's issue" },
      },
      required: ["last_name", "email"],
    },
  },
  {
    name: "update_crm_record",
    description: "Update fields on an existing Zoho CRM Contact, Lead, or Deal.",
    input_schema: {
      type: "object",
      properties: {
        module: { type: "string", enum: ["Contacts", "Leads", "Deals"] },
        record_id: { type: "string", description: "The record ID to update" },
        fields: { type: "object", description: "Key-value pairs of fields to update" },
      },
      required: ["module", "record_id", "fields"],
    },
  },
  {
    name: "log_conversation_activity",
    description: "Log the support conversation as a completed Task against a CRM record.",
    input_schema: {
      type: "object",
      properties: {
        module: { type: "string", enum: ["Contacts", "Leads"] },
        record_id: { type: "string" },
        subject: { type: "string", description: "Short title e.g. 'Chat Support – Billing Issue'" },
        summary: { type: "string", description: "Full summary of the conversation" },
      },
      required: ["module", "record_id", "subject", "summary"],
    },
  },
  {
    name: "get_pipeline_deals",
    description: "Fetch deals from the Zoho CRM pipeline, optionally filtered by stage.",
    input_schema: {
      type: "object",
      properties: {
        stage: { type: "string", description: "Deal stage e.g. 'Qualification', 'Closed Won'" },
        limit: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "search_crm",
    description: "Search for any record in Zoho CRM using criteria syntax.",
    input_schema: {
      type: "object",
      properties: {
        module: { type: "string", description: "CRM module e.g. Contacts, Leads, Deals" },
        criteria: { type: "string", description: "Zoho criteria e.g. (Last_Name:equals:Smith)" },
      },
      required: ["module", "criteria"],
    },
  },
];

export async function handleZohoTool(toolName, toolInput) {
  switch (toolName) {
    case "lookup_contact_by_email": {
      const contact = await lookupContact(toolInput.email);
      if (contact) {
        return {
          found: true,
          type: "Contact",
          id: contact.id,
          name: `${contact.First_Name || ""} ${contact.Last_Name || ""}`.trim(),
          email: contact.Email,
          phone: contact.Phone,
          company: contact.Account_Name?.name || contact.Account_Name,
        };
      }
      const lead = await lookupLead(toolInput.email);
      if (lead) {
        return {
          found: true,
          type: "Lead",
          id: lead.id,
          name: `${lead.First_Name || ""} ${lead.Last_Name || ""}`.trim(),
          email: lead.Email,
          phone: lead.Phone,
          company: lead.Company,
          lead_status: lead.Lead_Status,
        };
      }
      return { found: false, message: "No contact or lead found with that email." };
    }

    case "get_customer_deals": {
      const deals = await getContactDeals(toolInput.contact_id);
      return {
        count: deals.length,
        deals: deals.map((d) => ({
          id: d.id,
          name: d.Deal_Name,
          stage: d.Stage,
          amount: d.Amount,
          close_date: d.Closing_Date,
          probability: d.Probability,
        })),
      };
    }

    case "create_lead": {
      const result = await createLead({
        First_Name: toolInput.first_name,
        Last_Name: toolInput.last_name,
        Email: toolInput.email,
        Phone: toolInput.phone,
        Company: toolInput.company,
        Lead_Source: toolInput.lead_source || "Chat",
        Description: toolInput.description,
      });
      return {
        success: result?.status === "success" || !!result?.details?.id,
        record_id: result?.details?.id,
        message: result?.message || "Lead created successfully",
      };
    }

    case "update_crm_record": {
      const result = await updateRecord(
        toolInput.module,
        toolInput.record_id,
        toolInput.fields
      );
      return {
        success: result?.status === "success",
        message: result?.message || "Record updated",
      };
    }

    case "log_conversation_activity": {
      const result = await logActivity({
        module: toolInput.module,
        recordId: toolInput.record_id,
        subject: toolInput.subject,
        description: toolInput.summary,
        type: "Chat",
      });
      return {
        success: !!result,
        message: "Conversation logged in CRM",
      };
    }

    case "get_pipeline_deals": {
      const deals = await getPipelineDeals({
        stage: toolInput.stage,
        limit: toolInput.limit || 10,
      });
      const totalAmount = deals.reduce((sum, d) => sum + (d.Amount || 0), 0);
      return {
        count: deals.length,
        total_value: totalAmount,
        deals: deals.map((d) => ({
          id: d.id,
          name: d.Deal_Name,
          stage: d.Stage,
          amount: d.Amount,
          close_date: d.Closing_Date,
          owner: d.Owner?.name,
        })),
      };
    }

    case "search_crm": {
      const records = await searchRecords(toolInput.module, toolInput.criteria);
      return { count: records.length, records };
    }

    default:
      throw new Error(`Unknown Zoho tool: ${toolName}`);
  }
}
📄 package.json
📄 next.config.js
📄 vercel.json
