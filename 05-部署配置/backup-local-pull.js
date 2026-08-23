/**
 * 星河宠记数据库备份 - 本地电脑每日拉取（异地备份方案，2026-08-23）
 * 流程：免密 SSH（本机 ~/.ssh/id_ed25519）→ sftp 列出服务器 /var/backups/xinghuanhai/
 *       → 下载最新 xinghuanhai_*.sql.gz 到本地 E:\Backups\xinghuanhai\ → 本地保留最近 30 份
 * 运行：Windows 计划任务每日 07:00（node "E:\星河宠记\05-部署配置\backup-local-pull.js"）
 * 注意：私钥仅存本机（C:\Users\<用户>\.ssh\），不提交仓库；公钥在服务器 authorized_keys
 */
const { Client } = require('ssh2')
const fs = require('fs')
const path = require('path')
const os = require('os')

const HOST = '49.232.203.85'
const USER = 'root'
const REMOTE_DIR = '/var/backups/xinghuanhai'
const LOCAL_DIR = 'E:\\Backups\\xinghuanhai'
const KEEP_LOCAL = 30
const PRIVATE_KEY = path.join(os.homedir(), '.ssh', 'id_ed25519')

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`
  console.log(line)
  try {
    fs.mkdirSync(LOCAL_DIR, { recursive: true })
    fs.appendFileSync(path.join(LOCAL_DIR, 'pull.log'), line + '\n')
  } catch { /* 日志失败忽略 */ }
}

function newestName(names) {
  // 文件名 xinghuanhai_YYYYMMDD_HHMM.sql.gz，按字符串排序即时间序
  const candidates = names
    .filter((n) => /^xinghuanhai_\d{8}_\d{4}\.sql\.gz$/.test(n))
    .sort()
  return candidates.length > 0 ? candidates[candidates.length - 1] : null
}

const conn = new Client()
conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) { log('sftp 初始化失败: ' + err.message); process.exit(1) }

    sftp.readdir(REMOTE_DIR, (dirErr, list) => {
      if (dirErr) { log('列出远端目录失败: ' + dirErr.message); process.exit(1) }
      const names = list.map((f) => f.filename)
      const latest = newestName(names)
      if (!latest) { log('远端无备份文件，跳过'); conn.end(); process.exit(0) }

      const remote = `${REMOTE_DIR}/${latest}`
      fs.mkdirSync(LOCAL_DIR, { recursive: true })

      // 本地已有同名文件则跳过（幂等）
      const localFile = path.join(LOCAL_DIR, latest)
      if (fs.existsSync(localFile)) {
        log(`本地已存在最新备份 ${latest}，跳过`)
        conn.end()
        process.exit(0)
      }

      sftp.fastGet(remote, localFile, (getErr) => {
        if (getErr) { log('下载失败: ' + getErr.message); process.exit(1) }
        log(`已下载 ${latest} 到本地 E:\\Backups\\xinghuanhai\\`)

        // 清理本地旧备份（保留最近 30 份）
        const localFiles = fs.readdirSync(LOCAL_DIR)
          .filter((n) => /^xinghuanhai_\d{8}_\d{4}\.sql\.gz$/.test(n))
          .sort()
        while (localFiles.length > KEEP_LOCAL) {
          fs.unlinkSync(path.join(LOCAL_DIR, localFiles.shift()))
        }
        log('本地拉取完成')
        conn.end()
        process.exit(0)
      })
    })
  })
})
conn.on('error', (e) => { log('连接失败: ' + e.message); process.exit(1) })
conn.connect({
  host: HOST,
  port: 22,
  username: USER,
  privateKey: fs.readFileSync(PRIVATE_KEY),
})
