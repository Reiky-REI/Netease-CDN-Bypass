# 📖 Netease-CDN-Bypass API 文档

## 基础信息

- **地址**: `http://localhost:3002` 或 `https://你的域名`
- **协议**: HTTP/HTTPS
- **认证**: 无需认证（Cookie已内置）
- **跨域**: 支持（已配置CORS）

## 端点列表

| 端点 | 方法 | 说明 | 代理 |
|------|------|------|------|
| `/search` | GET | 搜索歌曲 | 否 |
| `/song/url` | GET | 获取播放链接 | 否 |
| `/song/proxy` | GET | 代理播放 | ✅ 是 |
| `/song/detail` | GET | 获取歌曲详情 | 否 |
| `/lyric` | GET | 获取歌词 | 否 |
| `/playlist/detail` | GET | 获取播放列表 | 否 |
| `/album` | GET | 获取专辑详情 | 否 |
| `/artist` | GET | 获取艺术家信息 | 否 |

## 详细说明

### 1. 搜索歌曲

```
GET /search?keywords=关键词&limit=数量
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `keywords` | string | ✅ | - | 搜索关键词 |
| `limit` | number | ❌ | 30 | 返回数量（1-100） |

**示例**: `/search?keywords=周杰伦&limit=5`

**响应**:
```json
{
  "result": {
    "songs": [
      {
        "id": 509781655,
        "name": "想你就写信 (Live)",
        "artists": [{"id": 6452, "name": "周杰伦"}],
        "album": {"id": 36412633, "name": "中国新歌声第二季 第13期"},
        "fee": 1,
        "duration": 238698
      }
    ],
    "songCount": 271
  }
}
```

---

### 2. 获取播放链接

```
GET /song/url?id=歌曲ID&br=比特率
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | number | ✅ | - | 歌曲ID |
| `br` | number | ❌ | 320 | 比特率（128/192/320/999） |

**示例**: `/song/url?id=509781655&br=320`

**响应**:
```json
{
  "code": 200,
  "data": [{
    "id": 509781655,
    "url": "http://m804.music.126.net/...",
    "br": 320000,
    "size": 9550125,
    "type": "mp3",
    "fee": 1,
    "payed": 1
  }]
}
```

---

### 3. 代理播放（推荐）

```
GET /song/proxy?id=歌曲ID&br=比特率
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | number | ✅ | - | 歌曲ID |
| `br` | number | ❌ | 320 | 比特率 |

**说明**: 
- 直接返回音频流（Content-Type: audio/mpeg）
- 无需额外处理，可直接用于 `<audio>` 标签
- 通过服务器代理，绕过防盗链

**示例**: `/song/proxy?id=509781655&br=320`

**使用方法**:
```html
<audio controls>
  <source src="http://localhost:3002/song/proxy?id=509781655&br=320" type="audio/mpeg">
</audio>
```

---

### 4. 获取歌曲详情

```
GET /song/detail?ids=歌曲ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `ids` | string | ✅ | 歌曲ID（多个用逗号分隔） |

**示例**: `/song/detail?ids=509781655`

**响应**:
```json
{
  "songs": [{
    "id": 509781655,
    "name": "想你就写信 (Live)",
    "ar": [{"id": 6452, "name": "周杰伦"}],
    "al": {"id": 36412633, "name": "中国新歌声第二季 第13期"},
    "fee": 1,
    "dt": 238698
  }],
  "code": 200
}
```

---

### 5. 获取歌词

```
GET /lyric?id=歌曲ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 歌曲ID |

**示例**: `/lyric?id=509781655`

**响应**:
```json
{
  "lrc": {
    "lyric": "[00:00.00] 作词 : 方文山\n[00:01.00] 作曲 : 周杰伦\n..."
  },
  "tlyric": {
    "lyric": "..."
  }
}
```

---

### 6. 获取播放列表详情

```
GET /playlist/detail?id=播放列表ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 播放列表ID |

**示例**: `/playlist/detail?id=2829473062`

**响应**:
```json
{
  "playlist": {
    "id": 2829473062,
    "name": "多想在平庸的生活拥抱你",
    "trackCount": 2,
    "tracks": [...]
  },
  "code": 200
}
```

---

### 7. 获取专辑详情

```
GET /album?id=专辑ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 专辑ID |

**示例**: `/album?id=36412633`

---

### 8. 获取艺术家信息

```
GET /artist?id=艺术家ID
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | number | ✅ | 艺术家ID |

**示例**: `/artist?id=6452`

## 使用示例

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
const searchRes = await fetch(`${API}/search?keywords=周杰伦&limit=5`);
const searchData = await searchRes.json();

// 播放
const playUrl = `${API}/song/proxy?id=${searchData.result.songs[0].id}&br=320`;
```

## 错误处理

所有错误返回JSON格式：

```json
{
  "error": "错误信息"
}
```

常见错误：
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 更新Cookie

1. 编辑 `.env` 文件
2. 更新 `NETEASE_COOKIE` 的值
3. 重启服务: `npm start` 或 `systemctl restart meting-api`
