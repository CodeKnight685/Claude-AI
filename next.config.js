/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "ALLOWALL",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.zoho.com https://*.zohocdn.com",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

3. Click **Commit changes**

---

## Also Update `lib/zoho-crm.js`

Since your region is `com`, make sure your `.env` in Vercel has:
```
ZOHO_REGION=com
