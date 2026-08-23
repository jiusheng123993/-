/**
 * 星河宠记 · 知识图谱审核后台逻辑（Phase 3）
 * 全部走 /api/admin/*，请求头带 x-admin-token（fail-closed，未配置恒 403）
 * 安全注意（审查项 S2 修复）：所有用户可控插值（entity_name/user_id/suggestion/admin_note）必须经 esc()
 * 事件一律 addEventListener（helmet CSP script-src-attr 'none' 禁止内联 onclick）
 */
(function () {
  'use strict';

  const BASE = '/api';

  /** 读取令牌：输入框优先，回退 localStorage；自动清理可能的 "ADMIN_TOKEN=" 前缀/引号（2026-08-23 容错） */
  function getToken() {
    const raw = document.getElementById('token').value.trim() || localStorage.getItem('adminToken') || '';
    return raw.replace(/^['"]?ADMIN_TOKEN=['"]?/i, '').trim();
  }

  /** 轻提示 */
  function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2200);
  }

  /** 请求头（JSON 请求附带 Content-Type） */
  function headers(json) {
    const h = { 'x-admin-token': getToken() };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  /** 显示/隐藏令牌提示条（403 或未输入时显示，让用户知道要做什么） */
  function showAuthWarning(show) {
    document.getElementById('auth-warning').classList.toggle('hidden', !show);
  }

  /** 统一响应处理：非 2xx 抛错；403 时额外提示令牌问题 */
  async function handle(r) {
    let body = {};
    try { body = await r.json(); } catch (e) { /* 非 JSON 响应 */ }
    if (r.status === 403) showAuthWarning(true);
    if (!r.ok) throw new Error(body.message || ('HTTP ' + r.status));
    return body;
  }

  /** HTML 转义（防存储型 XSS：所有用户可控字段必须经此函数） */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function saveToken() {
    // 容错：自动去掉可能复制进来的 "ADMIN_TOKEN=" 前缀与引号，再保存
    const raw = document.getElementById('token').value.trim();
    const clean = raw.replace(/^['"]?ADMIN_TOKEN=['"]?/i, '').trim();
    localStorage.setItem('adminToken', clean);
    document.getElementById('token').value = clean;
    showAuthWarning(!clean);
    toast(clean ? '令牌已保存' : '令牌为空，请粘贴 ADMIN_TOKEN');
    loadGraph();
  }

  async function loadGraph() {
    try {
      const r = await fetch(BASE + '/admin/knowledge', { headers: headers() });
      const body = await handle(r);
      if (!body.data) throw new Error('返回为空');
      document.getElementById('graph-version').textContent = body.data.version;
      document.getElementById('graph-json').value = JSON.stringify(body.data.data, null, 2);
      toast('图谱已加载');
    } catch (e) {
      toast('加载失败：' + e.message);
    }
  }

  async function saveGraph() {
    let data;
    try { data = JSON.parse(document.getElementById('graph-json').value); }
    catch (e) { toast('JSON 格式错误：' + e.message); return; }
    try {
      const r = await fetch(BASE + '/admin/knowledge', {
        method: 'PUT',
        headers: headers(true),
        body: JSON.stringify({ data }),
      });
      const body = await handle(r);
      toast('已保存，新版本：' + (body.data ? body.data.version : '?'));
      loadGraph();
    } catch (e) {
      toast('保存失败：' + e.message);
    }
  }

  async function loadFeedback() {
    const status = document.getElementById('fb-status').value;
    try {
      const r = await fetch(BASE + '/admin/feedback?status=' + encodeURIComponent(status), { headers: headers() });
      const body = await handle(r);
      const list = (body.data && body.data.list) || [];
      const box = document.getElementById('fb-list');
      if (list.length === 0) { box.textContent = '暂无反馈'; return; }
      // 所有用户可控字段（entity_name/user_id/suggestion/admin_note）必须 esc()（审查项 S2 修复）
      box.innerHTML = list.map((fb) => (
        '<div class="fb-item">' +
          '<div class="meta">[' + esc(fb.entity_type) + '] ' + esc(fb.entity_name) +
          ' · 用户 ' + esc(fb.user_id) +
          ' · ' + esc(String(fb.created_at || '').replace('T', ' ').slice(0, 16)) +
          ' <span class="status ' + esc(fb.status) + '">' + esc(fb.status) + '</span></div>' +
          '<div class="sug">' + esc(fb.suggestion) + '</div>' +
          '<button data-action="approve" data-id="' + esc(fb.id) + '">✓ 通过</button>' +
          '<button class="reject" data-action="reject" data-id="' + esc(fb.id) + '">✗ 驳回</button>' +
          (fb.admin_note ? '<span style="font-size:12px;color:#999;">备注：' + esc(fb.admin_note) + '</span>' : '') +
        '</div>'
      )).join('');
      // 事件委托：通过/驳回按钮
      box.querySelectorAll('button[data-action]').forEach((btn) => {
        btn.addEventListener('click', () => review(btn.dataset.id, btn.dataset.action));
      });
    } catch (e) {
      toast('加载失败：' + e.message);
    }
  }

  async function review(id, action) {
    const note = prompt(action === 'approve' ? '通过备注（如对照来源）' : '驳回原因');
    if (note === null) return;
    try {
      const r = await fetch(BASE + '/admin/feedback/' + id + '/review', {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ action, note: note || undefined }),
      });
      await handle(r);
      toast(action === 'approve' ? '已通过（如需落地数据，请到图谱页保存）' : '已驳回');
      loadFeedback();
    } catch (e) {
      toast('审核失败：' + e.message);
    }
  }

  function switchTab(name) {
    document.querySelectorAll('.tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.getElementById('panel-graph').classList.toggle('hidden', name !== 'graph');
    document.getElementById('panel-feedback').classList.toggle('hidden', name !== 'feedback');
    document.getElementById('panel-redeem').classList.toggle('hidden', name !== 'redeem');
    if (name === 'feedback') loadFeedback();
    if (name === 'redeem') loadRedeemCodes();
  }

  // ===== 兑换码（2026-08-23） =====

  /** 生成兑换码：POST /api/admin/redeem-codes，展示新码并刷新列表 */
  async function generateRedeemCodes() {
    const count = parseInt(document.getElementById('redeem-count').value, 10) || 1;
    const days = parseInt(document.getElementById('redeem-days').value, 10) || 30;
    const note = document.getElementById('redeem-note').value.trim();
    try {
      const r = await fetch(BASE + '/admin/redeem-codes', {
        method: 'POST',
        headers: headers(true),
        body: JSON.stringify({ count, days, note: note || undefined }),
      });
      const body = await handle(r);
      const codes = (body.data && body.data.codes) || [];
      // 新码展示（可复制）；全部字段为服务端生成，无用户输入
      document.getElementById('redeem-result').innerHTML =
        '<div style="margin-top:12px;padding:12px;background:#F0F7FF;border-radius:8px;">' +
        '生成成功（' + codes.length + ' 个，每个 ' + days + ' 天会员）：' +
        codes.map((c) => '<div style="font-family:Consolas,monospace;font-size:14px;margin-top:6px;">' + c + '</div>').join('') +
        '</div>';
      toast('已生成 ' + codes.length + ' 个兑换码');
      loadRedeemCodes();
    } catch (e) {
      toast('生成失败：' + e.message);
    }
  }

  /** 加载兑换码列表：GET /api/admin/redeem-codes?status= */
  async function loadRedeemCodes() {
    const status = document.getElementById('redeem-status').value;
    try {
      const r = await fetch(BASE + '/admin/redeem-codes?status=' + encodeURIComponent(status), { headers: headers() });
      const body = await handle(r);
      const list = (body.data && body.data.list) || [];
      const box = document.getElementById('redeem-list');
      if (list.length === 0) { box.textContent = '暂无兑换码'; return; }
      // note/used_by 为用户可控字段，必须 esc()（防存储型 XSS）
      box.innerHTML = list.map((c) => (
        '<div class="redeem-item">' +
          '<span class="redeem-code">' + esc(c.code) + '</span>' +
          '<span class="redeem-days">' + esc(c.days) + ' 天</span>' +
          (c.note ? '<span class="redeem-note">' + esc(c.note) + '</span>' : '') +
          '<span class="status ' + esc(c.status) + '">' + (c.status === 'used' ? '已使用' : '未使用') + '</span>' +
          (c.used_by ? '<span class="redeem-by">使用人 ' + esc(c.used_by) + '</span>' : '') +
        '</div>'
      )).join('');
    } catch (e) {
      toast('加载失败：' + e.message);
    }
  }

  // ===== 事件绑定（addEventListener，规避 CSP 内联事件限制） =====
  document.getElementById('btn-save-token').addEventListener('click', saveToken);
  document.getElementById('btn-test').addEventListener('click', loadGraph);
  document.getElementById('btn-save-graph').addEventListener('click', saveGraph);
  document.getElementById('btn-reload').addEventListener('click', loadGraph);
  document.getElementById('btn-refresh').addEventListener('click', loadFeedback);
  document.getElementById('fb-status').addEventListener('change', loadFeedback);
  document.getElementById('btn-gen-codes').addEventListener('click', generateRedeemCodes);
  document.getElementById('btn-refresh-codes').addEventListener('click', loadRedeemCodes);
  document.getElementById('redeem-status').addEventListener('change', loadRedeemCodes);
  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // 初始化：回填本地令牌并加载图谱；未存令牌时显示提示条
  document.getElementById('token').value = localStorage.getItem('adminToken') || '';
  if (!getToken()) showAuthWarning(true);
  loadGraph();
})();
