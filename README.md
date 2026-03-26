# Zoho CRM MCP Server

A Model Context Protocol (MCP) server that lets Claude perform full CRUD operations on your Zoho CRM data.

---

## Tools Available

| Tool | Description |
|------|-------------|
| `list_modules` | List all available CRM modules |
| `get_module_fields` | Get field definitions for a module |
| `create_record` | Create a new record |
| `get_record` | Fetch a record by ID |
| `list_records` | List records with pagination & sorting |
| `search_records` | Search with Zoho criteria syntax |
| `update_record` | Update fields on an existing record |
| `delete_record` | Delete one or more records |

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Get Zoho OAuth credentials

1. Go to [https://api-console.zoho.com/](https://api-console.zoho.com/)
2. Create a **Self Client** application
3. Set the scope:
   ```
   ZohoCRM.modules.ALL,ZohoCRM.settings.modules.READ,ZohoCRM.settings.fields.READ
   ```
4. Generate a **refresh token** using the Authorization Code flow

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token
ZOHO_REGION=com        # or: eu, in, com.au, jp
```

### 4. Add to Claude Desktop config

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "zoho-crm": {
      "command": "node",
      "args": ["/absolute/path/to/zoho-crm-mcp/src/index.js"],
      "env": {
        "ZOHO_CLIENT_ID": "your_client_id",
        "ZOHO_CLIENT_SECRET": "your_client_secret",
        "ZOHO_REFRESH_TOKEN": "your_refresh_token",
        "ZOHO_REGION": "com"
      }
    }
  }
}
```

> **Tip:** You can use the `.env` file OR the `env` block in the config — both work.

### 5. Restart Claude Desktop

---

## Usage Examples

Once connected, you can ask Claude:

- *"List all available modules in my Zoho CRM"*
- *"Create a new Lead with name John Smith, email john@acme.com, company Acme Corp"*
- *"Search for Contacts where email starts with john"*
- *"Update the Lead status to Qualified for record ID 1234567890"*
- *"Delete the Deal with ID 9876543210"*
- *"Show me the last 50 Deals sorted by Close_Date descending"*

---

## Search Criteria Syntax

```
Single condition:   (Field_Name:operator:value)
Multiple (AND):     ((Field1:equals:X)and(Field2:starts_with:Y))
Multiple (OR):      ((Field1:equals:X)or(Field2:equals:Z))
```

Operators: `equals`, `not_equal`, `starts_with`, `ends_with`, `contains`, `not_contains`, `greater_than`, `less_than`, `greater_equal`, `less_equal`, `between`, `in`

---

## Zoho Scopes Required

```
ZohoCRM.modules.ALL
ZohoCRM.settings.modules.READ
ZohoCRM.settings.fields.READ
```

---

## File Structure

```
zoho-crm-mcp/
├── src/
│   ├── index.js          # MCP server + tool definitions
│   ├── zoho-client.js    # Zoho CRM API wrapper
│   └── auth.js           # OAuth token management
├── .env.example          # Environment variable template
├── package.json
└── README.md
```
