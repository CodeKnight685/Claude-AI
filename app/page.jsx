import ZohoCRMSupportChat from "../components/ZohoCRMSupportChat";

export default function Home() {
  return <ZohoCRMSupportChat />;
}
```
4. Click **Commit changes**

---

### Step 3 — Create `app/api/chat/route.js`
1. Click **Add file → Create new file**
2. Name: `app/api/chat/route.js`
3. Paste the full content from the `route.js` file I generated earlier
4. Click **Commit changes**

---

### Step 4 — Create `components/ZohoCRMSupportChat.jsx`
1. Click **Add file → Create new file**
2. Name: `components/ZohoCRMSupportChat.jsx`
3. Paste the full content from the component file I generated earlier
4. Click **Commit changes**

---

### Step 5 — Create `lib/zoho-crm.js`
1. Click **Add file → Create new file**
2. Name: `lib/zoho-crm.js`
3. Paste the full content from `zoho-crm.js`
4. Click **Commit changes**

---

### Step 6 — Create `lib/zoho-tools.js`
1. Click **Add file → Create new file**
2. Name: `lib/zoho-tools.js`
3. Paste the full content from `zoho-tools.js`
4. Click **Commit changes**

---

### Step 7 — Delete Incorrect Root Files
Delete these files that are wrongly at the root level:
- `auth.js` 🗑️
- `index.js` 🗑️
- `zoho-client.js` 🗑️

---

## After All Steps Your Repo Should Look Like:
```
📁 app/
    📄 layout.js
    📄 page.jsx
    📁 api/chat/
        📄 route.js
📁 components/
    📄 ZohoCRMSupportChat.jsx
📁 lib/
    📄 zoho-crm.js
    📄 zoho-tools.js
📄 package.json
📄 next.config.js
📄 vercel.json
