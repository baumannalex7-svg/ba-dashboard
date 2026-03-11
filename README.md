# Baumann & Associates — Project Performance Dashboard

PMI PMBOK®-compliant Earned Value Management dashboard, branded for Baumann & Associates.

---

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1 — Create a free Vercel account
Go to https://vercel.com and sign up (free).

### Step 2 — Install Vercel CLI (optional but fastest)
```bash
npm install -g vercel
```

### Step 3A — Deploy via Vercel CLI (recommended)
```bash
# Unzip the project folder, then from inside it:
npm install
vercel
```
Follow the prompts — accept all defaults. Your live URL will appear at the end.

### Step 3B — Deploy via Vercel Web UI (no terminal needed)
1. Go to https://vercel.com/new
2. Click **"Browse"** and upload this entire project folder
3. Vercel auto-detects Create React App — click **Deploy**
4. Your dashboard is live at `https://your-project.vercel.app`

---

## 🌐 Embed in Your Typedream Website

Once deployed, copy your Vercel URL and add this embed block in Typedream:

1. In Typedream, go to **Pages → Add Page** → name it "Project Dashboard"
2. Add a **Custom Code / Embed** block
3. Paste this code (replace the URL with your Vercel URL):

```html
<iframe
  src="https://YOUR-PROJECT.vercel.app"
  width="100%"
  height="950px"
  frameborder="0"
  style="border-radius:10px; border:none;"
  allow="fullscreen">
</iframe>
```

4. Add "Project Dashboard" to your Typedream navigation menu
5. Done — the dashboard will appear as a native page on baumann-associates.com

---

## 📁 Project Structure

```
ba-dashboard/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── index.js            # React entry
│   └── App.js              # Full dashboard app
├── package.json            # Dependencies
├── vercel.json             # Vercel config
└── README.md               # This file
```

---

## 🎨 Branding

Colors match Baumann & Associates visual identity:
- Navy `#0B1C2D` — primary background
- Gold `#C9A84C` — accent / highlights
- Cormorant Garamond — display headings
- Jost — body / UI text

---

## 📊 PMI Metrics Included

| Metric | Formula | Standard |
|--------|---------|----------|
| CPI | EV / AC | PMBOK® 7th Ed. |
| SPI | EV / PV | PMBOK® 7th Ed. |
| TCPI | (BAC−EV) / (BAC−AC) | PMBOK® 7th Ed. |
| CV | EV − AC | ANSI/EIA-748 |
| SV | EV − PV | ANSI/EIA-748 |
| EAC | AC + (BAC−EV)/CPI | PMBOK® 7th Ed. |
| ETC | (BAC−EV) / CPI | PMBOK® 7th Ed. |
| VAC | BAC − EAC | PMBOK® 7th Ed. |

---

© Baumann and Associates Consulting Ltd. All rights reserved.
