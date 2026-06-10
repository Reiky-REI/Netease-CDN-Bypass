const express = require('express')
const https = require('https')
const fs = require('fs')

const app = express()
const PORT = 3003

// 读取Cookie
let COOKIE = ''
try {
  const envPath = '/opt/meting/.env'
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    const match = envContent.split('\n').find(l => l.startsWith('NETEASE_COOKIE='))
    if (match) COOKIE = match.split('=').slice(1).join('=').trim()
  }
} catch (e) {}

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(express.json())

// 首页
app.get('/', (req, res) => {
  res.send(getHTML())
})

// 获取当前Cookie状态
app.get('/api/status', (req, res) => {
  res.json({
    hasCookie: !!COOKIE,
    cookieLength: COOKIE.length,
    cookiePreview: COOKIE ? COOKIE.substring(0, 50) + '...' : '未配置'
  })
})

// 更新Cookie
app.post('/api/update-cookie', (req, res) => {
  const { cookie } = req.body
  if (!cookie) {
    return res.json({ success: false, message: '请提供Cookie' })
  }

  const envPath = '/opt/meting/.env'
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8')
    envContent = envContent.replace(/NETEASE_COOKIE=.*/, 'NETEASE_COOKIE=' + cookie)
    fs.writeFileSync(envPath, envContent)
  }

  COOKIE = cookie
  res.json({ success: true, message: 'Cookie已更新，重启服务后生效' })
})

// 测试Cookie
app.post('/api/test-cookie', async (req, res) => {
  const { cookie } = req.body
  const testCookie = cookie || COOKIE

  if (!testCookie) {
    return res.json({ success: false, message: '请提供Cookie' })
  }

  try {
    const result = await callApi('/api/nuser/account/get', {}, testCookie)
    if (result.account) {
      res.json({
        success: true,
        data: {
          nickname: result.profile?.nickname || '未知',
          vipType: result.account.vipType,
          isVip: result.account.vipType > 0,
          isPaid: result.account.paidFee
        }
      })
    } else {
      res.json({ success: false, message: 'Cookie无效' })
    }
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
})

// 搜索（测试用）
app.get('/api/search', async (req, res) => {
  const { keywords, limit = 5 } = req.query
  try {
    const result = await callApi('/api/cloudsearch/pc', {
      s: keywords,
      type: 1,
      limit,
      total: 'true'
    })
    res.json(result)
  } catch (e) {
    res.json({ error: e.message })
  }
})

// 调用NetEase API
function callApi(path, data, cookie = COOKIE) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString()
    const options = {
      hostname: 'interface.music.163.com',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://music.163.com/'
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(e) }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

// HTML页面
function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>网易云音乐 Cookie 管理</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { text-align: center; color: white; margin-bottom: 30px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
    .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
    h2 { color: #333; margin-bottom: 16px; font-size: 18px; }
    .status { padding: 12px; border-radius: 8px; margin-bottom: 16px; }
    .status.ok { background: #d4edda; color: #155724; }
    .status.error { background: #f8d7da; color: #721c24; }
    textarea { width: 100%; min-height: 120px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; }
    textarea:focus { outline: none; border-color: #667eea; }
    .btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; margin-right: 10px; transition: background 0.3s; }
    .btn:hover { background: #5a6fd6; }
    .btn:disabled { background: #ccc; cursor: not-allowed; }
    .btn-success { background: #28a745; }
    .btn-success:hover { background: #218838; }
    .step { margin: 8px 0; line-height: 1.6; }
    .step-num { display: inline-block; width: 24px; height: 24px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-size: 12px; margin-right: 8px; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin: 12px 0; }
    .tabs { display: flex; border-bottom: 2px solid #ddd; margin-bottom: 16px; }
    .tab { padding: 10px 20px; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s; }
    .tab:hover { background: #f8f9fa; }
    .tab.active { border-bottom-color: #667eea; color: #667eea; font-weight: bold; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .cookie-example { background: #2d3748; color: #e2e8f0; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 12px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎵 网易云音乐 Cookie 管理</h1>

    <div class="card">
      <h2>📊 当前状态</h2>
      <div id="status" class="status">加载中...</div>
    </div>

    <div class="card">
      <h2>📝 更新 Cookie</h2>
      <div class="tabs">
        <div class="tab active" onclick="switchTab('manual')">✏️ 手动输入</div>
        <div class="tab" onclick="switchTab('guide')">📖 获取教程</div>
      </div>

      <div id="tab-manual" class="tab-content active">
        <p style="margin-bottom: 12px; color: #666;">粘贴你的网易云音乐Cookie：</p>
        <textarea id="cookieInput" placeholder="MUSIC_U=xxx; __csrf=xxx; __remember_me=true"></textarea>
        <br><br>
        <button class="btn" onclick="updateCookie()">💾 保存Cookie</button>
        <button class="btn btn-success" onclick="testCookie()">🔍 测试Cookie</button>
      </div>

      <div id="tab-guide" class="tab-content">
        <h3>获取Cookie的方法</h3>
        <div class="step"><span class="step-num">1</span> 打开 <a href="https://music.163.com" target="_blank">music.163.com</a> 并登录</div>
        <div class="step"><span class="step-num">2</span> 按 <code>F12</code> 打开开发者工具</div>
        <div class="step"><span class="step-num">3</span> 切换到 <code>Application</code> → <code>Cookies</code></div>
        <div class="step"><span class="step-num">4</span> 找到并复制以下字段：</div>

        <div class="warning">
          <strong>必须的字段：</strong><br>
          <code>MUSIC_U</code> - 登录凭证（最重要）<br>
          <code>__csrf</code> - CSRF令牌<br>
          <code>__remember_me</code> - 记住登录
        </div>

        <p style="margin-top: 12px;"><strong>或者更简单的方法：</strong></p>
        <div class="step"><span class="step-num">1</span> 在 <code>Network</code> 标签中刷新页面</div>
        <div class="step"><span class="step-num">2</span> 点击任意请求</div>
        <div class="step"><span class="step-num">3</span> 在 <code>Request Headers</code> 中找到 <code>Cookie</code></div>
        <div class="step"><span class="step-num">4</span> 复制整个Cookie字符串</div>
      </div>
    </div>

    <div class="card">
      <h2>📖 API 文档</h2>
      <p style="margin-bottom: 12px; color: #666;">直接API地址：<code>https://neteaseapi.aprism.top</code></p>

      <h3>搜索歌曲</h3>
      <div class="cookie-example">GET /search?keywords=周杰伦&limit=5</div>

      <h3>获取播放链接</h3>
      <div class="cookie-example">GET /song/url?id=509781655&br=320</div>

      <h3>获取歌词</h3>
      <div class="cookie-example">GET /lyric?id=509781655</div>
    </div>
  </div>

  <script>
    async function loadStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        const statusDiv = document.getElementById('status');
        if (data.hasCookie) {
          statusDiv.className = 'status ok';
          statusDiv.innerHTML = '✅ Cookie已配置 (' + data.cookieLength + ' 字符)<br>预览: ' + data.cookiePreview;
        } else {
          statusDiv.className = 'status error';
          statusDiv.innerHTML = '❌ 未配置Cookie';
        }
      } catch (e) {
        document.getElementById('status').innerHTML = '❌ 加载失败';
      }
    }

    async function updateCookie() {
      const cookie = document.getElementById('cookieInput').value.trim();
      if (!cookie) { alert('请输入Cookie'); return; }
      try {
        const res = await fetch('/api/update-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cookie })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) loadStatus();
      } catch (e) { alert('保存失败: ' + e.message); }
    }

    async function testCookie() {
      const cookie = document.getElementById('cookieInput').value.trim();
      if (!cookie) { alert('请输入Cookie'); return; }
      try {
        const res = await fetch('/api/test-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cookie })
        });
        const data = await res.json();
        if (data.success) {
          alert('✅ Cookie有效！\\n昵称: ' + data.data.nickname + '\\nVIP: ' + (data.data.isVip ? '是' : '否'));
        } else {
          alert('❌ ' + data.message);
        }
      } catch (e) { alert('测试失败: ' + e.message); }
    }

    function switchTab(name) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + name).classList.add('active');
    }

    loadStatus();
  </script>
</body>
</html>`
}

app.listen(PORT, '0.0.0.0', () => {
  console.log('Cookie管理页面: http://localhost:' + PORT)
})
