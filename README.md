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

### 2. Install ngrok

1. Go to [https://ngrok.com](https://ngrok.com) and create a free account
2. Download ngrok for your platform
3. Unzip it and place the executable somewhere on your system (e.g. `C:\ngrok` on Windows or `/usr/local/bin` on Mac/Linux)
4. Connect your account by running the command shown on your ngrok dashboard:
   ```bash
   ngrok config add-authtoken YOUR_TOKEN_HERE
   ```

**Verify it's installed:**
```bash
ngrok version
```

---

## Setup

### 1. Start the relay server

Open a terminal in the project folder and run:

```bash
npm init -y
npm install ws
node server.js
```

You should see: `Relay server running on ws://localhost:8080`

Leave this terminal open.

### 2. Start the tunnel

Open a **second terminal** and run:

```bash
ngrok http 8080
```

ngrok will show a forwarding URL like:

```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:8080
```

Copy that `https://...` URL — you'll need it in the next step.

### 3. Host the HTML files

Push `display.html` and `send.html` to a GitHub Pages repo, or just open them directly from your file system for testing.

### 4. Open the pages

Replace `YOUR_NGROK_URL` below with the URL from step 2.

**Display (open on the TV/projector):**
```
display.html?server=wss://YOUR_NGROK_URL&room=myevent
```

**Send (share this link with phone users):**
```
send.html?server=wss://YOUR_NGROK_URL&room=myevent
```

> **Important:** Use `wss://` (not `https://`) for the server parameter. Just replace `https://` with `wss://` from the ngrok URL.

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