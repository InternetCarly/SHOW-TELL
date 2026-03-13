# Image Relay for Live Events

A simple setup for sending images from phones to a shared display (TV/projector) in real time using WebSockets.

**How it works:** Phones open `send.html` → user picks a photo → image is sent over WebSocket to a relay server → relay broadcasts to `display.html` → image appears on the big screen.

---

## Prerequisites

### 1. Install Node.js

**Windows:**
1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version
3. Run the installer (keep all defaults checked)
4. Restart your terminal after installing

**Mac:**
```bash
brew install node
```

**Verify it's installed:**
```bash
node --version
npm --version
```

> **Windows PowerShell users:** If you get a "running scripts is disabled" error when running `npm`, open PowerShell as Administrator and run:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```
> Or just use **Command Prompt (cmd)** instead, which doesn't have this restriction.

---

## Setup (local network)

You can run the relay server on your machine and access it from any device on the same Wi‑Fi network (no ngrok needed).

### 1. Install dependencies & start the relay server

From the project folder run:

```bash
npm install
npm start
```

You should see:

```
Relay server running on http://localhost:8080 (WebSocket ready)
✅ Serving static files from /path/to/project
```

Leave this terminal open.

### 2. Find your local IP address

On **macOS**, run:

```bash
ipconfig getifaddr en0
```

On **Windows**, run:

```powershell
ipconfig
```

Look for an address like `192.168.x.x` on your Wi‑Fi adapter.

### 3. Open the pages on your phone (same Wi‑Fi)

Use your computer’s IP in the URLs below.

**Display (TV/projector):**

```
http://<YOUR_IP>:8080/index.html?server=ws://<YOUR_IP>:8080&room=myevent
```

**Send (phone):**

```
http://<YOUR_IP>:8080/send.html?server=ws://<YOUR_IP>:8080&room=myevent
```

> ✅ Make sure `server=` starts with `ws://` (not `ws:` or `wss://` unless you have TLS).

---

## Optional: Use ngrok for remote access

If you want people to connect from outside your local network, you can still use ngrok (or another tunnel) as described below.

### 1. Install ngrok (optional)

1. Go to [https://ngrok.com](https://ngrok.com) and create a free account
2. Download ngrok for your platform
3. Unzip it and place the executable somewhere on your system
4. Connect your account:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

### 2. Start the tunnel

In a separate terminal run:

```bash
ngrok http 8080
```

Copy the `https://...` forwarding URL.

### 3. Open the pages

**Display:**
```
index.html?server=wss://YOUR_NGROK_URL&room=myevent
```

**Send:**
```
send.html?server=wss://YOUR_NGROK_URL&room=myevent
```

> **Important:** Use `wss://` (not `https://`) for the server parameter.

---

## URL Parameters

| Parameter | Description                    | Default       |
|-----------|--------------------------------|---------------|
| `server`  | WebSocket URL of the relay     | `ws://localhost:8080` |
| `room`    | Room name (for separate events)| `default`     |

You can run multiple independent sessions by using different room names.

---

## File Overview

| File           | What it does                                                    |
|----------------|----------------------------------------------------------------|
| `server.js`    | WebSocket relay — receives images from senders, broadcasts to displays |
| `display.html` | Fullscreen display page — shows images as they arrive           |
| `send.html`    | Mobile-friendly sender page — pick/take a photo and send it     |

---

## Tips

- Images are automatically resized to 1280px wide on the phone before sending to keep transfers fast.
- The display and sender pages will auto-reconnect if the connection drops.
- For GitHub Pages hosting, the ngrok URL changes every time you restart ngrok (unless you're on a paid plan). You'll need to update the links you share each session.
- ngrok's free tier shows a browser warning page on first visit — users may need to click through it once.

---

## Quick Test (local only)

If you just want to test on your own machine without ngrok:

1. Run `node server.js`
2. Open `display.html` in one browser tab
3. Open `send.html` in another tab
4. Pick an image and hit Send

Both pages default to `ws://localhost:8080` so no URL parameters are needed for local testing.