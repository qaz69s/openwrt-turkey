// SPDX-License-Identifier: Apache-2.0
// Turkey — 配置页

'use strict';
'require form';
'require poll';
'require rpc';
'require ui';
'require uci';
'require view';

const callGetStatus = rpc.declare({
	object: 'luci.turkey',
	method: 'getStatus',
	expect: {}
});

const callRestart = rpc.declare({
	object: 'luci.turkey',
	method: 'restart',
	expect: {}
});

// 将字符串转为十六进制
function strToHex(s) {
	var hex = '';
	for (var i = 0; i < s.length; i++) {
		var c = s.charCodeAt(i).toString(16);
		if (c.length === 1) c = '0' + c;
		hex += c;
	}
	return hex;
}

return view.extend({
	render: function() {
		var m, s, o;

		m = new form.Map('turkey', 'Turkey',
			'Telemt MTProxy 服务端管理。');

		// ── 状态栏（kiwi 风格）────────────────────────────────
		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function() {
			function renderStatusHTML(st) {
				var spanTemp = '<em><span style="color:%s"><strong>%s</strong></span></em>';
				return st.running
					? String.format(spanTemp, 'var(--bs-success, green)', 'Turkey 运行中')
					: String.format(spanTemp, 'var(--bs-danger, red)', 'Turkey 未运行');
			}
			function checkStatus() {
				return L.resolveDefault(callGetStatus(), {}).then(function(st) {
					var el = document.getElementById('turkey-cfg-status');
					if (el) el.innerHTML = renderStatusHTML(st);
				});
			}
			poll.add(checkStatus, 5);
			checkStatus();
			return E('div', { 'class': 'cbi-section' }, [
				E('p', { id: 'turkey-cfg-status' }, '收集状态中…')
			]);
		};

		// ── 基础设置────────────────────────────────────────────
		s = m.section(form.NamedSection, 'general', 'turkey', '基础设置');
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Flag, 'enabled', '启用服务',
			'开启后 Turkey 将随系统自动启动。');
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Value, 'port', '监听端口',
			'Telegram 客户端连接的端口。范围：1-65535，建议使用高位端口避免冲突。');
		o.datatype = 'range(1,65535)';
		o.default = '8443';
		o.placeholder = '8443';
		o.rmempty = false;

		o = s.option(form.ListValue, 'log_level', '日志级别');
		o.value('debug',   'Debug');
		o.value('verbose', 'Verbose');
		o.value('normal',  'Normal');
		o.value('silent',  'Silent');
		o.default = 'normal';

		o = s.option(form.Value, 'tls_domain', 'TLS 伪装域名',
			'用于 Fake-TLS (ee) 模式的 SNI 域名。更改后之前生成的 ee 链接将失效。');
		o.placeholder = 'speedtest.cn';
		o.datatype = 'hostname';

		o = s.option(form.Flag, 'mask', '流量伪装',
			'将非 MTProto 流量透明转发到伪装域名，返回真实 HTTPS 内容。');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Flag, 'tls_emulation', 'TLS 模拟',
			'获取真实证书长度并模拟 TLS 记录行为。');
		o.default = '1';
		o.rmempty = false;

		o = s.option(form.Value, 'ad_tag', '广告标签（可选）',
			'从 @MTProxybot 获取的 32 位十六进制推广标签。');
		o.optional = true;
		o.datatype = 'maxlength(32)';

		o = s.option(form.Flag, 'use_middle_proxy', 'Middle-End 转发',
			'启用 ME 传输模式，国内网络环境建议关闭。');
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Flag, 'manage_firewall', '自动管理防火墙',
			'自动在 WAN 区域开放服务端口。');
		o.default = '1';
		o.rmempty = false;

		// ── 代理模式───────────────────────────────────────────
		s = m.section(form.NamedSection, 'mode', 'turkey', '代理模式');
		s.anonymous = false;
		s.addremove = false;

		o = s.option(form.Flag, 'classic', 'Classic 模式',
			'标准 MTProto 代理模式。');
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Flag, 'secure', 'Secure 模式 (dd)',
			'安全模式，使用 dd 前缀。');
		o.default = '0';
		o.rmempty = false;

		o = s.option(form.Flag, 'tls', 'Fake-TLS 模式 (ee)',
			'伪装成 TLS 流量，使用 ee 前缀。');
		o.default = '1';
		o.rmempty = false;

		// ── 分享链接───────────────────────────────────────────
		o = s.option(form.DummyValue, '_links', '分享链接',
			'点击可切换显示 / 隐藏。');
		o.cfgvalue = function(section_id) {
			var port   = uci.get('turkey', 'general', 'port') || '8443';
			var secret = uci.get('turkey', 'hello', 'secret') || '';
			var domain = uci.get('turkey', 'general', 'tls_domain') || 'speedtest.cn';
			var classic = uci.get('turkey', 'mode', 'classic') === '1';
			var secure  = uci.get('turkey', 'mode', 'secure') === '1';
			var tls     = uci.get('turkey', 'mode', 'tls') === '1';

			if (!secret || secret === '00000000000000000000000000000000')
				return E('em', {}, '（需先配置用户密钥）');

			var links = [];

			if (tls) {
				var domainHex = strToHex(domain);
				var eeSecret = 'ee' + secret + domainHex;
				var eeLink = 'tg://proxy?server=SERVER_IP&port=' + port + '&secret=' + eeSecret;
				links.push({
					label: 'Fake-TLS (ee)',
					link: eeLink
				});
			}
			if (secure) {
				var ddLink = 'tg://proxy?server=SERVER_IP&port=' + port + '&secret=dd' + secret;
				links.push({
					label: 'Secure (dd)',
					link: ddLink
				});
			}
			if (classic) {
				var clLink = 'tg://proxy?server=SERVER_IP&port=' + port + '&secret=' + secret;
				links.push({
					label: 'Classic',
					link: clLink
				});
			}

			if (links.length === 0)
				return E('em', {}, '（至少需启用一种代理模式）');

			return E('div', { 'style': 'max-width:42em' }, links.map(function(item) {
				var input = E('input', {
					'type': 'password',
					'readonly': '',
					'value': item.link,
					'style': 'display:block;width:100%;margin-bottom:.25rem;font-family:var(--bs-font-monospace,monospace);font-size:.8125em;cursor:pointer',
					'title': '点击切换显示 / 隐藏',
					'click': function(ev) {
						ev.currentTarget.type = ev.currentTarget.type === 'password' ? 'text' : 'password';
					}
				});
				var label = E('strong', { 'style': 'font-size:.8125rem' }, item.label + '：');
				var copyBtn = E('button', {
					'class': 'btn cbi-button',
					'style': 'margin-left:.375rem;white-space:nowrap;font-size:.75rem',
					'title': '复制 ' + item.label + ' 链接',
					'click': function(ev) {
						ev.preventDefault();
						var btn = ev.currentTarget;
						var done = function() {
							var orig = btn.textContent;
							btn.textContent = '已复制 ✓';
							setTimeout(function() { btn.textContent = orig; }, 1500);
						};
						if (navigator.clipboard) {
							navigator.clipboard.writeText(item.link).then(done);
						} else {
							var t = document.createElement('textarea');
							t.value = item.link;
							document.body.appendChild(t);
							t.select();
							document.execCommand('copy');
							document.body.removeChild(t);
							done();
						}
					}
				}, '复制');
				return E('div', { 'style': 'margin-bottom:.5rem' }, [label, E('div', { 'style': 'display:flex;align-items:center;gap:.25rem' }, [input, copyBtn])]);
			}));
		};
		o.write = function() {};

		// ── 用户管理───────────────────────────────────────────
		s = m.section(form.NamedSection, 'hello', 'user',
			'用户管理');
		s.anonymous = false;
		s.addremove = true;

		o = s.option(form.Value, 'name', '用户名',
			'用户在代理链接中的标识名称。');
		o.optional = true;

		o = s.option(form.Value, 'secret', '密钥（32 位十六进制）',
			'通过 openssl rand -hex 16 生成。用户使用该密钥连接代理。');
		o.password = true;
		o.datatype = 'minlength(32)';
		o.default = '00000000000000000000000000000000';
		o.rmempty = false;
		o.renderWidget = function(section_id, option_index, cfgvalue) {
			var origNode = form.Value.prototype.renderWidget.call(this, section_id, option_index, cfgvalue);
			var genBtn = E('button', {
				'class': 'btn cbi-button',
				'style': 'margin-left:.375rem;white-space:nowrap',
				'title': '生成随机 32 位十六进制密钥',
				'click': function(ev) {
					ev.preventDefault();
					var raw = new Uint8Array(16);
					crypto.getRandomValues(raw);
					var hex = Array.from(raw).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
					var input = origNode.querySelector('input[type="password"], input[type="text"]');
					if (input) {
						input.value = hex;
						input.dispatchEvent(new Event('input', { bubbles: true }));
						input.dispatchEvent(new Event('change', { bubbles: true }));
					}
				}
			}, '随机生成');
			return E('div', { 'style': 'display:flex;align-items:center' }, [origNode, genBtn]);
		};

		return m.render();
	},

	handleSaveApply: function(ev, mode) {
		return this.handleSave(ev).then(function() {
			return ui.changes.apply(mode == '0').then(function() {
				return L.resolveDefault(callRestart(), null);
			});
		});
	}
});
