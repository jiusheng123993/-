/**
 * 星河宠记 · 知识图谱审核后台逻辑（Phase 3）
 * 全部走 /api/admin/*，请求头带 x-admin-token（fail-closed，未配置恒 403）
 * 安全注意（审查项 S2 修复）：所有用户可控插值（entity_name/user_id/suggestion/admin_note）必须经 esc()
 * 事件一律 addEventListener（helmet CSP script-src-attr 'none' 禁止内联 onclick）
 */
(function () {
  'use strict';

  const BASE = '/api';

  /** 读取令牌：输入框优先，回退 localStorage */
  function getToken() {
    return document.getElementById('token').value.trim() || localStorage.getItem('adminToken') || '';
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

  /** 统一响应处理：非 2xx 抛错 */
  async function handle(r) {
    let body = {};
    try { body = await r.json(); } catch (e) { /* 非 JSON 响应 */ }
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
    localStorage.setItem('adminToken', document.getElementById('token').value.trim());
    toast('令牌已保存');
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
    if (name === 'feedback') loadFeedback();
  }

  // ===== 事件绑定（addEventListener，规避 CSP 内联事件限制） =====
  document.getElementById('btn-save-token').addEventListener('click', saveToken);
  document.getElementById('btn-test').addEventListener('click', loadGraph);
  document.getElementById('btn-save-graph').addEventListener('click', saveGraph);
  document.getElementById('btn-reload').addEventListener('click', loadGraph);
  document.getElementById('btn-refresh').addEventListener('click', loadFeedback);
  document.getElementById('fb-status').addEventListener('change', loadFeedback);
  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  // 初始化：回填本地令牌并加载图谱
  document.getElementById('token').value = localStorage.getItem('adminToken') || '';
  loadGraph();
})();
