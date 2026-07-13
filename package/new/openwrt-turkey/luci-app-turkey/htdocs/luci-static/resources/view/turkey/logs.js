// SPDX-License-Identifier: Apache-2.0
// Turkey — 日志页

'use strict';
'require dom';
'require poll';
'require rpc';
'require ui';
'require view';

/* ── injectCSS ─────────────────────────────────────── */
function injectCSS() {
	if (document.getElementById('turkey-log-css')) return;
	var el = document.createElement('style');
	el.id = 'turkey-log-css';
	el.textContent = [
		'.turkey-log .log-pane{',
		'  font-family:var(--bs-font-monospace,monospace);',
		'  background:var(--bs-tertiary-bg,rgba(127,127,127,.06));',
		'  color:inherit;',
		'  border:1px solid var(--bs-border-color,rgba(127,127,127,.15));',
		'  border-radius:.375rem;',
		'  max-height:68vh;overflow:auto;',
		'}',
		'.turkey-log .log-pane pre{',
		'  padding:.5rem .75rem;margin:0;',
		'  white-space:pre-wrap;word-wrap:break-word;overflow-wrap:break-word;',
		'  font-size:.8125rem;line-height:1.35;',
		'  color:inherit;',
		'}',
		'.turkey-log .log-pane .log-line{',
		'  display:flex;gap:.2rem;padding:0;',
		'  align-items:baseline;',
		'}',
		'.turkey-log .log-pane .log-line .lvl{',
		'  flex-shrink:0;font-size:.65rem;font-weight:700;',
		'  padding:0 .35rem;border-radius:3px;',
		'  text-transform:uppercase;line-height:1.5;',
		'  min-width:2.8rem;text-align:center;',
		'}',
		'.turkey-log .log-pane .log-line .lvl-info{',
		'  background:var(--bs-info-bg,rgba(137,180,250,.18));color:var(--bs-info,var(--info-text,#89b4fa));',
		'}',
		'.turkey-log .log-pane .log-line .lvl-warn{',
		'  background:var(--bs-warning-bg,rgba(250,179,135,.18));color:var(--bs-warning,var(--warning-text,#fab387));',
		'}',
		'.turkey-log .log-pane .log-line .lvl-error{',
		'  background:var(--bs-danger-bg,rgba(243,139,168,.18));color:var(--bs-danger,var(--danger-text,#f38ba8));',
		'}',
		'.turkey-log .log-pane .log-line .lvl-debug{',
		'  background:var(--bs-secondary-bg,rgba(166,173,200,.12));color:var(--bs-secondary,var(--muted,#6c7086));',
		'}',
		'.turkey-log .log-pane .log-line .msg{flex:1;min-width:0;}',
		'.turkey-log .log-pane .log-line .msg mark{',
		'  background:var(--bs-highlight-bg,rgba(255,193,7,.40));color:inherit;',
		'  border-radius:2px;padding:0 2px;',
		'}',
		'.turkey-log .log-bar{',
		'  display:flex;align-items:center;gap:.5rem;',
		'  padding:.375rem 0;flex-wrap:wrap;',
		'}',
		'.turkey-log .log-bar .spacer{flex:1}',
		'.turkey-log .log-bar input[type=search]{',
		'  width:120px;height:25px;flex:none;padding:0 .5rem;',
		'  border:1px solid var(--bs-border-color,rgba(127,127,127,.15));',
		'  border-radius:.25rem;',
		'  background:var(--bs-tertiary-bg,rgba(127,127,127,.06));color:inherit;',
		'  font-size:.75rem;',
		'}',
		'.turkey-log .log-bar input[type=search]:focus{',
		'  outline:2px solid rgba(137,180,250,.5);',
		'}',
		'.turkey-log .log-btn{',
		'  display:inline-flex;align-items:center;gap:.25rem;',
		'  padding:.25rem .5rem;border-radius:.25rem;cursor:pointer;',
		'  border:1px solid var(--bs-border-color,rgba(127,127,127,.15));',
		'  background:var(--bs-tertiary-bg,rgba(127,127,127,.06));color:inherit;',
		'  font-size:.75rem;user-select:none;',
		'}',
		'.turkey-log .log-btn:hover{background:var(--bs-secondary-bg,rgba(127,127,127,.12))}',
		'.turkey-log .log-btn.active{',
		'  background:rgba(64,160,43,.18);border-color:rgba(64,160,43,.35);',
		'}',
		'.turkey-log .log-btn.danger:hover{',
		'  background:rgba(243,139,168,.25);border-color:rgba(243,139,168,.4);',
		'}',
		'.turkey-log .log-btn svg{width:14px;height:14px;flex-shrink:0}',
		'.turkey-log .log-muted{opacity:.55;font-style:italic;font-size:.75rem}',
		'.turkey-log .log-stat{font-size:.75rem;opacity:.7}',
		'.turkey-log .log-stat strong{opacity:1;font-weight:700}',
	].join('');
	document.head.appendChild(el);
}

/* ── SVG icons ─────────────────────────────────────── */
var ICONS = {
	reverse: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 3v10M2 6l3-3 3 3"/><path d="M11 13V3M8 10l3 3 3-3"/></svg>',
	play:    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12l10-6z"/></svg>',
	pause:   '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>',
	trash:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M2 4h12M5.3 4V2.7a.7.7 0 01.7-.7h4a.7.7 0 01.7.7V4M6 7v5M10 7v5M3.5 4l.9 9.3a1 1 0 001 .7h5.2a1 1 0 001-.7l.9-9.3"/></svg>',
};

/* ── RPC ───────────────────────────────────────────── */
var getLogRpc = rpc.declare({
	object: 'luci.turkey',
	method: 'getLog'
});

var clearLogRpc = rpc.declare({
	object: 'luci.turkey',
	method: 'clearLog',
	expect: { result: false }
});

/* ── Log helpers for Telemt output ─────────────────── */
/* Telemt 日志格式: "2026-05-06T22:43:30 INFO server: ..." or RUST_LOG style */
var TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
var LEVEL_RE = /(INFO|WARN|WARNING|ERROR|DEBUG|TRACE|VERBOSE|NORMAL|SILENT)\b/i;
var JSON_LEVEL_RE = /"level"\s*:\s*"(info|warn|error|debug|trace|fatal)"/i;
var JSON_MSG_RE   = /"message"\s*:\s*"(.*?)"/;

function parseLine(raw) {
	raw = raw.trim();
	if (!raw) return { level: 'info', msg: '' };
	/* 先尝试提取日志级别关键词 */
	var lv = raw.match(LEVEL_RE);
	if (lv) {
		var lvl = lv[1].toLowerCase();
		if (lvl === 'warning') lvl = 'warn';
		/* 去掉时间戳和级别前缀，取后面内容 */
		var msg = raw.replace(TIMESTAMP_RE, '').replace(LEVEL_RE, '').trim();
		msg = msg.replace(/^\s*[-:]\s*/, '');
		return { level: lvl, msg: msg || raw };
	}
	/* JSON 格式 */
	var jl = raw.match(JSON_LEVEL_RE);
	var jm = raw.match(JSON_MSG_RE);
	if (jl && jm) return { level: jl[1].toLowerCase(), msg: jm[1] };
	/* 兜底关键词 */
	if (/error|fail|panic/i.test(raw)) return { level: 'error', msg: raw };
	if (/warn/i.test(raw))  return { level: 'warn',  msg: raw };
	if (/debug|trace/i.test(raw)) return { level: 'debug', msg: raw };
	return { level: 'info', msg: raw };
}

function esc(s) {
	return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function buildLine(parsed, query) {
	var lvl = parsed.level;
	var msg = esc(parsed.msg);
	if (query && query.length >= 2) {
		var re = new RegExp('(' + esc(query).replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
		msg = msg.replace(re, '<mark>$1</mark>');
	}
	return '<div class="log-line">'
		+ '<span class="lvl lvl-' + lvl + '">' + lvl + '</span>'
		+ '<span class="msg">' + msg + '</span>'
		+ '</div>';
}

function filterLines(lines, query) {
	if (!query || query.length < 2) return lines;
	var q = query.toLowerCase();
	return lines.filter(function(r) { return r.toLowerCase().indexOf(q) !== -1; });
}

return view.extend({
	__paused:      false,
	__reverse:     true,
	__logLines:    [],
	__searchQuery: '',
	__maxLines:    500,

	render: function() {
		injectCSS();
		var self = this;

		var logPre  = E('pre', { id: 'turkey-log-content' });
		var logPane = E('div', { 'class': 'log-pane' }, [logPre]);
		var statusEl = E('span', { 'class': 'log-stat', id: 'turkey-log-status' }, '--');

		var searchInput = E('input', {
			type: 'search',
			placeholder: '搜索日志…',
			id: 'turkey-log-search',
			input: function() {
				self.__searchQuery = this.value;
				self.__renderLog();
			}
		});

		var revBtn = E('button', {
			'class': 'log-btn active',
			title: '倒序（最新在前）',
			click: function() {
				self.__reverse = !self.__reverse;
				this.classList.toggle('active', self.__reverse);
				this.title = self.__reverse ? '倒序（最新在前）' : '正序（最早在前）';
				self.__renderLog();
			}
		});
		revBtn.innerHTML = ICONS.reverse;

		var pauseBtn = E('button', {
			'class': 'log-btn',
			title: '暂停刷新',
			click: function() {
				self.__paused = !self.__paused;
				this.classList.toggle('active', self.__paused);
				this.innerHTML = self.__paused ? ICONS.play : ICONS.pause;
				this.title = self.__paused ? '恢复刷新' : '暂停刷新';
				if (!self.__paused) self.__renderLog();
			}
		});
		pauseBtn.innerHTML = ICONS.pause;

		var clearBtn = E('button', {
			'class': 'log-btn danger',
			title: '清空日志',
			click: function() {
				return clearLogRpc().then(function() {
					self.__logLines = ['日志已清空'];
					self.__renderLog();
				}).catch(function(err) {
					ui.addNotification(null,
						E('p', {}, '清空失败：' + (err.message || err)), 'danger');
				});
			}
		});
		clearBtn.innerHTML = ICONS.trash;

		var toolbar = E('div', { 'class': 'log-bar' }, [
			searchInput, revBtn, pauseBtn, clearBtn,
			E('span', { 'class': 'spacer' }),
			statusEl,
			E('span', { 'class': 'log-muted' },
				'每 ' + (L.env.pollinterval || '3') + ' 秒刷新 ｜ 上限 500 行')
		]);

		var root = E('div', { 'class': 'cbi-map turkey-log' }, [
			E('h2', {}, 'Turkey — 日志'),
			E('div', { 'class': 'cbi-section' }, [toolbar, logPane])
		]);

		var fetchLog = function() {
			return getLogRpc().then(function(res) {
				var content = (res && res.log) ? res.log : '';
				var lines = content.split('\x1E');
				if (lines.length > self.__maxLines)
					lines = lines.slice(-self.__maxLines);
				self.__logLines = lines;
				if (!self.__paused) self.__renderLog();
			}).catch(function(e) {
				self.__logLines = ['错误: ' + (e.message || e)];
				self.__renderLog();
			});
		};
		poll.add(fetchLog);
		fetchLog();

		return root;
	},

	__renderLog: function() {
		var el = document.getElementById('turkey-log-content');
		if (!el) return;

		var query = this.__searchQuery;
		var raw = query ? filterLines(this.__logLines, query) : this.__logLines;
		if (this.__reverse) raw = raw.slice().reverse();

		var html = [];
		for (var i = 0; i < raw.length; i++) {
			if (!raw[i]) continue;
			html.push(buildLine(parseLine(raw[i]), query));
		}

		el.innerHTML = html.length
			? html.join('\n')
			: '<div style="padding:.75rem;opacity:.5;font-style:italic">无匹配日志</div>';

		var pane = el.parentNode;
		if (pane && this.__reverse) pane.scrollTop = 0;

		var st = document.getElementById('turkey-log-status');
		if (st) {
			var shown = raw.filter(function(l) { return l.trim(); }).length;
			var total = this.__logLines.filter(function(l) { return l.trim(); }).length;
			st.innerHTML = query
				? '筛选 <strong>' + shown + '</strong> / ' + total + ' 行'
				: (this.__paused
					? '共 <strong>' + total + '</strong> 行（已暂停）'
					: '共 <strong>' + total + '</strong> 行');
		}
	},

	handleReset:     null,
	handleSave:      null,
	handleSaveApply: null
});
