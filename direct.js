const express = require('express')
const https = require('https')
const fs = require('fs')

const app = express()
const PORT = 3002

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

// 搜索歌曲
app.get('/search', async (req, res) => {
  const { keywords, limit = 30, offset = 0 } = req.query
  try {
    const result = await callApi('/api/cloudsearch/pc', {
      s: keywords,
      type: 1,
      limit,
      offset,
      total: 'true'
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取播放链接
app.get('/song/url', async (req, res) => {
  const { id, br = 320 } = req.query
  try {
    const result = await callApi('/api/song/enhance/player/url', {
      ids: JSON.stringify([id]),
      br: br * 1000
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取歌曲详情
app.get('/song/detail', async (req, res) => {
  const { ids } = req.query
  try {
    // 使用正确的NetEase API路径
    const result = await callApi('/api/v3/song/detail/', {
      c: JSON.stringify(ids.split(',').map(id => ({ id: parseInt(id), v: 0 })))
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取歌词
app.get('/lyric', async (req, res) => {
  const { id } = req.query
  try {
    const result = await callApi('/api/song/lyric', {
      id,
      lv: -1,
      tv: -1
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取播放列表详情
app.get('/playlist/detail', async (req, res) => {
  const { id } = req.query
  try {
    const result = await callApi('/api/v6/playlist/detail', {
      id,
      n: 1000,
      s: 8
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取专辑详情
app.get('/album', async (req, res) => {
  const { id } = req.query
  try {
    const result = await callApi('/api/v1/album/' + id, {
      ext: 'true'
    })
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取艺术家信息
app.get('/artist', async (req, res) => {
  const { id } = req.query
  try {
    const result = await callApi('/api/v1/artist/' + id, {})
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 获取播放链接（带代理）- 实时获取URL并转发
app.get('/song/proxy', async (req, res) => {
  const { id, br = 320 } = req.query

  try {
    // 实时获取播放链接（URL会绑定到NAS的IP）
    const result = await callApi('/api/song/enhance/player/url', {
      ids: JSON.stringify([id]),
      br: br * 1000
    })

    if (result.data && result.data[0] && result.data[0].url) {
      const songData = result.data[0]
      // 直接返回音频流
      await streamAudio(songData.url, res)
    } else {
      res.json(result)
    }
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// 音频代理端点
app.get('/proxy', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    // 设置请求头绕过防盗链
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://music.163.com/',
      'Origin': 'https://music.163.com',
      'Accept': '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'identity',
      'Connection': 'keep-alive'
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` })
    }

    // 设置响应头
    res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Accept-Ranges', 'bytes')

    // 流式传输音频
    const reader = response.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
    res.end()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// 音频流转发函数
async function streamAudio(url, res) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://music.163.com/',
    'Origin': 'https://music.163.com',
    'Accept': '*/*',
    'Accept-Encoding': 'identity'
  }

  const response = await fetch(url, { headers })

  if (!response.ok) {
    throw new Error(`Upstream returned ${response.status}`)
  }

  // 设置响应头
  res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Accept-Ranges', 'bytes')

  // 流式传输音频
  const reader = response.body.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    res.write(value)
  }
  res.end()
}

// 调用NetEase API
function callApi(path, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString()
    const options = {
      hostname: 'interface.music.163.com',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': COOKIE,
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

app.listen(PORT, '0.0.0.0', () => {
  console.log('Direct API: http://localhost:' + PORT)
})
