# 🎵 Netease-CDN-Bypass

一个绕过NetEase CDN防盗链的音乐API解决方案。

## 🎯 解决的问题

NetEase CDN有防盗链机制：
- 播放链接绑定到请求IP
- 浏览器直接请求会返回403
- 需要通过服务器代理转发

## 💡 解决方案

**在服务器上获取Cookie，所有请求都通过服务器代理转发**

```
用户浏览器 → 服务器API → NetEase CDN → 服务器代理 → 用户浏览器
```

## 📦 安装

```bash
# 克隆项目
git clone <repository-url>
cd Netease-CDN-Bypass

# 安装依赖
npm install

# 配置Cookie
cp .env.example .env
# 编辑 .env 文件，填入你的网易云音乐Cookie
```

## 🚀 启动

```bash
# 启动API服务器（端口3002）
npm start

# 启动管理页面（端口3003，可选）
npm run web
```

## 📖 API 文档

### 基础信息

- **地址**: `http://localhost:3002` 或 `https://你的域名`
- **协议**: HTTP/HTTPS
- **认证**: 无需认证（Cookie已内置）

### 端点列表

| 端点 | 方法 | 说明 |
|------|------|------|
| `/search` | GET | 搜索歌曲 |
| `/song/url` | GET | 获取播放链接 |
| `/song/proxy` | GET | 代理播放（推荐） |
| `/song/detail` | GET | 获取歌曲详情 |
| `/lyric` | GET | 获取歌词 |
| `/playlist/detail` | GET | 获取播放列表 |
| `/album` | GET | 获取专辑详情 |
| `/artist` | GET | 获取艺术家信息 |

### 详细说明

#### 1. 搜索歌曲

```
GET /search?keywords=关键词&limit=数量
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `keywords` | string | ✅ | - | 搜索关键词 |
| `limit` | number | ❌ | 30 | 返回数量 |

**示例**: `/search?keywords=周杰伦&limit=5`

---

#### 2. 获取播放链接

```
GET /song/url?id=歌曲ID&br=比特率
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | number | ✅ | - | 歌曲ID |
| `br` | number | ❌ | 320 | 比特率（128/192/320/999） |

**示例**: `/song/url?id=509781655&br=320`

---

#### 3. 代理播放（推荐）

```
GET /song/proxy?id=歌曲ID&br=比特率
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | number | ✅ | - | 歌曲ID |
| `br` | number | ❌ | 320 | 比特率 |

**说明**: 直接返回音频流，可用于`<audio>`标签

**示例**: `/song/proxy?id=509781655&br=320`

---

#### 4. 获取歌曲详情

```
GET /song/detail?ids=歌曲ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | string | ✅ | 歌曲ID（多个用逗号分隔） |

**示例**: `/song/detail?ids=509781655`

---

#### 5. 获取歌词

```
GET /lyric?id=歌曲ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 歌曲ID |

**示例**: `/lyric?id=509781655`

---

#### 6. 获取播放列表详情

```
GET /playlist/detail?id=播放列表ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 播放列表ID |

**示例**: `/playlist/detail?id=2829473062`

---

#### 7. 获取专辑详情

```
GET /album?id=专辑ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 专辑ID |

**示例**: `/album?id=36412633`

---

#### 8. 获取艺术家信息

```
GET /artist?id=艺术家ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 艺术家ID |

**示例**: `/artist?id=6452`

## 📝 使用示例

### HTML/JavaScript

```html
<audio id="player" controls></audio>
<button onclick="play('509781655')">播放</button>

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

// 搜索
async function search(keyword) {
  const res = await fetch(`${API}/search?keywords=${encodeURIComponent(keyword)}&limit=5`);
  return await res.json();
}

// 播放
function getPlayUrl(songId) {
  return `${API}/song/proxy?id=${songId}&br=320`;
}
```

## 🔧 配置

### 环境变量

复制 `.env.example` 为 `.env`，然后填入你的Cookie：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
NETEASE_COOKIE=MUSIC_U=你的Cookie值; __csrf=你的csrf值; __remember_me=true
```

### 获取Cookie

1. 打开 https://music.163.com 并登录
2. 按 `F12` 打开开发者工具
3. 切换到 `Application` → `Cookies`
4. 复制以下字段：
   - `MUSIC_U` - 登录凭证（最重要）
   - `__csrf` - CSRF令牌
   - `__remember_me` - 记住登录

或者更简单的方法：
1. 在 `Network` 标签中刷新页面
2. 点击任意请求
3. 在 `Request Headers` 中找到 `Cookie`
4. 复制整个Cookie字符串

### 更新Cookie

```bash
# 编辑 .env 文件
vi .env

# 重启服务
npm start
```

## 🌐 部署

### 本地部署

```bash
npm start
# API服务运行在 http://localhost:3002
```

### 服务器部署

```bash
# 使用PM2守护进程
npm install -g pm2
pm2 start direct.js --name netease-api
pm2 save
pm2 startup
```

### Docker部署

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

## 📋 管理页面

启动管理页面（端口3003）：

```bash
npm run web
```

访问 http://localhost:3003 可以：
- 查看当前Cookie状态
- 更新Cookie
- 测试Cookie有效性
- 查看API文档

## ⚠️ 注意事项

1. **Cookie有效期**：Cookie会过期，需要定期更新
2. **并发限制**：同时播放多首歌可能占用大量带宽
3. **防盗链**：使用 `/song/proxy` 代理播放，避免403错误
4. **VIP歌曲**：需要有效的VIP账号Cookie才能播放完整版

## 📄 License

MIT
