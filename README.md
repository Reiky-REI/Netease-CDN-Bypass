# 🎵 Netease-CDN-Bypass

A solution to bypass NetEase CDN anti-hotlink protection for music playback.

## 🎯 Problem

NetEase CDN has anti-hotlink protection:
- Playback URLs are bound to the requesting IP
- Direct browser requests return 403 errors
- Requests need to be proxied through a server

## 💡 Solution

**Get cookies on the server, proxy all requests through the server**

```
User Browser → Server API → NetEase CDN → Server Proxy → User Browser
```

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd Netease-CDN-Bypass

# Install dependencies
npm install

# Configure cookie
cp .env.example .env
# Edit .env file with your NetEase cookie
```

## 🚀 Usage

```bash
# Start API server (port 3002)
npm start

# Start management page (port 3003, optional)
npm run web
```

## 📖 API Documentation

### Basic Info

- **URL**: `http://localhost:3002` or `https://your-domain`
- **Protocol**: HTTP/HTTPS
- **Authentication**: None required (cookie built-in)

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/search` | GET | Search songs |
| `/song/url` | GET | Get playback URL |
| `/song/proxy` | GET | Proxy playback (recommended) |
| `/song/detail` | GET | Get song details |
| `/lyric` | GET | Get lyrics |
| `/playlist/detail` | GET | Get playlist details |
| `/album` | GET | Get album details |
| `/artist` | GET | Get artist info |

### Detailed Documentation

See [API.md](API.md) for complete API documentation.

## 📝 Usage Examples

### HTML/JavaScript

```html
<audio id="player" controls></audio>
<button onclick="play('509781655')">Play</button>

<script>
  const API = 'http://localhost:3002';
  
  function play(songId) {
    const player = document.getElementById('player');
    player.src = `${API}/song/proxy?id=${songId}&br=320`;
    player.play();
  }
</script>
```

### Node.js

```javascript
const API = 'http://localhost:3002';

// Search
async function search(keyword) {
  const res = await fetch(`${API}/search?keywords=${encodeURIComponent(keyword)}&limit=5`);
  return await res.json();
}

// Play
function getPlayUrl(songId) {
  return `${API}/song/proxy?id=${songId}&br=320`;
}
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and fill in your cookie:

```bash
cp .env.example .env
```

Edit `.env` file:

```
NETEASE_COOKIE=MUSIC_U=your_cookie; __csrf=your_csrf; __remember_me=true
```

### Getting Cookie

1. Open https://music.163.com and login
2. Press `F12` to open Developer Tools
3. Go to `Application` → `Cookies`
4. Copy these fields:
   - `MUSIC_U` - Login token (most important)
   - `__csrf` - CSRF token
   - `__remember_me` - Remember login

Or simpler method:
1. Refresh page in `Network` tab
2. Click any request
3. Find `Cookie` in `Request Headers`
4. Copy the entire cookie string

### Updating Cookie

```bash
# Edit .env file
vi .env

# Restart service
npm start
```

## 🌐 Deployment

### Local Deployment

```bash
npm start
# API server runs on http://localhost:3002
```

### Server Deployment

```bash
# Using PM2
npm install -g pm2
pm2 start direct.js --name netease-api
pm2 save
pm2 startup
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3002
CMD ["node", "direct.js"]
```

```bash
docker build -t netease-api .
docker run -d -p 3002:3002 --name netease-api netease-api
```

## 📋 Management Page

Start management page (port 3003):

```bash
npm run web
```

Visit http://localhost:3003 to:
- View current cookie status
- Update cookie
- Test cookie validity
- View API documentation

## ⚠️ Notes

1. **Cookie Expiry**: Cookies expire and need regular updates
2. **Concurrent Limits**: Playing multiple songs may consume bandwidth
3. **Anti-hotlink**: Use `/song/proxy` for playback to avoid 403 errors
4. **VIP Songs**: Valid VIP account cookie required for full playback

## 📄 License

MIT

## Thanks

- [Linux.do](https://linux.do) community
