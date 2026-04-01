import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let db: Firestore;

try {
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const dbId = firebaseConfig.firestoreDatabaseId || undefined;
    
    if (getApps().length === 0) {
      if (firebaseConfig.projectId) {
        console.log(`Initializing Firebase Admin for project: ${firebaseConfig.projectId}`);
        initializeApp({
          projectId: firebaseConfig.projectId,
        });
        
        console.log(`Using Firestore database: ${dbId || '(default)'}`);
        db = getFirestore(dbId);
      } else {
        console.warn("Firebase config found but projectId is missing. Using default initialization.");
        initializeApp();
        db = getFirestore();
      }
    } else {
      console.log("Firebase Admin already initialized.");
      // Ensure we use the correct database ID even if already initialized
      db = getFirestore(dbId);
    }
  } else {
    console.log("No firebase-applet-config.json found. Using default initialization.");
    if (getApps().length === 0) {
      initializeApp();
    }
    db = getFirestore();
  }
} catch (error) {
  console.error("CRITICAL: Failed to initialize Firebase Admin:", error);
}

// Background Worker: Post scheduled pins
async function processScheduledPins() {
  try {
    if (!db) {
      console.warn("Firestore db not initialized. Skipping scheduled pins check.");
      return;
    }
    const now = new Date();
    const pinsRef = db.collection('scheduledPins');
    
    let snapshot;
    try {
      snapshot = await pinsRef
        .where('status', '==', 'scheduled')
        .where('scheduledTime', '<=', now.toISOString())
        .limit(10)
        .get();
    } catch (error: any) {
      if (error.code === 7 || error.message?.includes('PERMISSION_DENIED')) {
        console.error('CRITICAL: Firestore PERMISSION_DENIED in background worker.');
        console.error('This usually means the service account lacks access to the database.');
        console.error('Database ID:', process.env.FIRESTORE_DATABASE_ID || 'using config value');
      }
      throw error;
    }

    if (snapshot.empty) return;

    console.log(`Processing ${snapshot.size} scheduled pins...`);

    for (const doc of snapshot.docs) {
      const pin = doc.data();
      const pinId = doc.id;

      try {
        // 1. Get account token
        const accountDoc = await db.collection('accounts').doc(pin.accountId).get();
        if (!accountDoc.exists) {
          await doc.ref.update({ status: 'failed', error: 'Account not found' });
          continue;
        }
        const account = accountDoc.data();
        const token = account?.accessToken;

        if (!token) {
          await doc.ref.update({ status: 'failed', error: 'No access token for account' });
          continue;
        }

        // 2. Get a board (if not specified, pick the first one)
        let boardId = pin.boardId;
        if (!boardId) {
          console.log(`No boardId specified for pin ${pinId}. Fetching boards for account...`);
          const boardsResponse = await fetch("https://api.pinterest.com/v5/boards", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (!boardsResponse.ok) {
            const errorText = await boardsResponse.text();
            console.error(`Failed to fetch boards for account @${account?.username}:`, errorText);
            await doc.ref.update({ status: 'failed', error: `Pinterest API error fetching boards: ${errorText}` });
            continue;
          }

          const boardsData = await boardsResponse.json();
          if (boardsData.items && boardsData.items.length > 0) {
            boardId = boardsData.items[0].id;
            console.log(`Auto-selected board: ${boardsData.items[0].name} (${boardId})`);
          } else {
            console.warn(`No boards found for account @${account?.username}`);
            await doc.ref.update({ status: 'failed', error: 'No boards found for account. Please create a board on Pinterest.' });
            continue;
          }
        }

        // 3. Post the pin
        console.log(`Posting pin to Pinterest for account @${account?.username}...`);
        const postResponse = await fetch("https://api.pinterest.com/v5/pins", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            board_id: boardId,
            title: pin.title,
            description: pin.description,
            link: pin.link,
            media_source: {
              source_type: "image_url",
              url: pin.imageUrl
            }
          })
        });

        let postData: any;
        const contentType = postResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          postData = await postResponse.json();
        } else {
          const text = await postResponse.text();
          postData = { message: text || "Non-JSON response from Pinterest" };
        }

        if (postResponse.ok) {
          await doc.ref.update({ 
            status: 'posted', 
            pinterestPinId: postData.id,
            postedAt: FieldValue.serverTimestamp()
          });
          console.log(`Successfully posted pin ${pinId} to Pinterest.`);
        } else {
          console.error(`Failed to post pin ${pinId}:`, postData);
          await doc.ref.update({ 
            status: 'failed', 
            error: postData.message || 'Pinterest API error' 
          });
        }
      } catch (e: any) {
        console.error(`Error processing pin ${pinId}:`, e);
        await doc.ref.update({ status: 'failed', error: e.message }).catch(err => console.error("Failed to update pin status:", err));
      }
    }
  } catch (error: any) {
    console.error('Error in processScheduledPins worker:', error.message);
  }
}

// Start the background worker (every 1 minute)
// Note: On Vercel, this interval will NOT run continuously.
// Use Vercel Cron Jobs to hit an endpoint for scheduled tasks.
if (!process.env.VERCEL) {
  setInterval(() => {
    processScheduledPins().catch(err => console.error("Unhandled error in processScheduledPins interval:", err));
  }, 60000);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API route for Cron Jobs (Vercel)
app.get("/api/cron/process-pins", async (req, res) => {
  // Simple secret check to prevent unauthorized calls
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    await processScheduledPins();
    res.json({ status: "success", message: "Processed scheduled pins" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Pinterest OAuth Callback
app.get(["/auth/pinterest/callback", "/auth/pinterest/callback/"], async (req, res) => {
  const { code, state } = req.query;
  res.send(`
    <html>
      <head>
        <title>PinViral AI - Authenticating</title>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
          body { background: #09090b; color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 24px; padding: 40px; text-align: center; max-width: 400px; width: 100%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
          h1 { color: #ef4444; font-size: 1.5rem; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.025em; }
          p { color: #a1a1aa; font-size: 0.875rem; line-height: 1.5; margin: 0 0 24px 0; }
          .loader { width: 32px; height: 32px; border: 3px solid #ef4444; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto; }
          .btn { display: inline-flex; items-center: center; justify-content: center; padding: 12px 24px; background: #ef4444; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.875rem; transition: all 0.2s; text-decoration: none; }
          .btn:hover { background: #dc2626; transform: translateY(-1px); }
          .success-icon { color: #10b981; font-size: 48px; margin-bottom: 16px; }
          .error-icon { color: #ef4444; font-size: 48px; margin-bottom: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>PinViral AI</h1>
          <div id="status-content">
            <p>Finalizing your Pinterest connection...</p>
            <div class="loader"></div>
          </div>
          
          <script>
            const content = document.getElementById('status-content');
            
            function showStatus(success, title, message) {
              content.innerHTML = \`
                <div class="\${success ? 'success-icon' : 'error-icon'}">\${success ? '✓' : '✕'}</div>
                <p style="color: white; font-weight: 600; margin-bottom: 8px;">\${title}</p>
                <p>\${message}</p>
                <button onclick="window.close()" class="btn">Close Window</button>
              \`;
            }

            console.log("Pinterest callback reached. Opener:", window.opener ? "Found" : "Not found");
            
            if (window.opener) {
              try {
                window.opener.postMessage({ 
                  type: 'PINTEREST_AUTH_SUCCESS', 
                  code: '${code}',
                  state: '${state}'
                }, '*');
                
                showStatus(true, "Authentication Successful", "Your account is now connected. This window will close automatically.");
                setTimeout(() => window.close(), 2000);
              } catch (e) {
                console.error("Error posting message to opener:", e);
                showStatus(false, "Communication Error", "We couldn't notify the main app. Please close this window and try again.");
              }
            } else {
              console.error("No opener found.");
              showStatus(false, "Connection Lost", "The connection to the main app was lost. Please return to the original tab and refresh if necessary.");
            }
          </script>
        </div>
      </body>
    </html>
  `);
});

// Pinterest OAuth URL Generation
app.get("/api/auth/pinterest/url", (req, res) => {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const isPlaceholder = !clientId || clientId === "YOUR_PINTEREST_CLIENT_ID";
  
  // Construct redirect URI dynamically based on request if APP_URL is not set
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const appUrl = process.env.APP_URL || (protocol + "://" + host);
  const redirectUri = process.env.PINTEREST_REDIRECT_URI || (appUrl + "/auth/pinterest/callback");
  
  if (isPlaceholder) {
    console.warn("Pinterest Client ID not configured or using placeholder. OAuth will use demo mode.");
    return res.json({ url: redirectUri + "?code=demo_code&state=demo_state" });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'boards:read,pins:read,pins:write,user_accounts:read',
    state: Math.random().toString(36).substring(7)
  });

  const authUrl = `https://www.pinterest.com/oauth/?${params.toString()}`;
  console.log(`Generated Pinterest Auth URL: ${authUrl}`);
  res.json({ url: authUrl });
});

// Pinterest Token Exchange
app.post("/api/pinterest/token", async (req, res) => {
  const { code } = req.body;
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
  
  // Construct redirect URI dynamically based on request if APP_URL is not set
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const appUrl = process.env.APP_URL || (protocol + "://" + host);
  const redirectUri = process.env.PINTEREST_REDIRECT_URI || (appUrl + "/auth/pinterest/callback");

  if (!clientId || !clientSecret || code === 'demo_code') {
    console.log("Using demo mode for Pinterest token exchange. Credentials missing or demo code used.");
    return res.json({
      access_token: "demo_at_" + Math.random().toString(36).substring(7),
      refresh_token: "demo_rt_" + Math.random().toString(36).substring(7),
      expires_in: 3600,
      username: "DemoUser_" + Math.random().toString(36).substring(7)
    });
  }

  try {
    console.log(`Exchanging code for token with redirect_uri: ${redirectUri}`);
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${authHeader}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri as string
      })
    });

    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response from Pinterest token endpoint:", text);
      return res.status(response.status).json({ error: "Pinterest returned non-JSON response", details: text });
    }

    if (!response.ok) {
      console.error("Pinterest token exchange failed:", data);
      return res.status(response.status).json(data);
    }
    
    // Fetch user profile to get username
    const userResponse = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { "Authorization": `Bearer ${data.access_token}` }
    });
    
    let userData: any = {};
    const userContentType = userResponse.headers.get("content-type");
    if (userContentType && userContentType.includes("application/json")) {
      userData = await userResponse.json();
    } else {
      console.warn("Could not fetch Pinterest user profile (Non-JSON response)");
    }

    res.json({
      ...data,
      username: userData.username || "PinterestUser"
    });
  } catch (e) {
    console.error("Pinterest token exchange error:", e);
    res.status(500).json({ error: "Failed to exchange token" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
      // Run initial check
      processScheduledPins().catch(console.error);
    });
  }
}

startServer();

export default app;
