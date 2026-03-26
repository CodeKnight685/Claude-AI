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

5. Click **Commit changes**

---

## Step 2 — Check Framework Preset in Vercel

Go to Vercel → **Settings → Build and Deployment** → what does **Framework Preset** show?

If it shows **Other** instead of **Next.js** that's why headers aren't working — change it to **Next.js** and save.

---

## Step 3 — After Redeploy Check Headers Again

Once Vercel shows green ✅ open your URL in browser → DevTools → Network → first request → Response Headers.

You should now see:
```
x-frame-options: ALLOWALL
