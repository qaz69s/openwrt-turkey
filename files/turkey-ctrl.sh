#!/bin/sh
# turkey-ctrl.sh -- sync UCI config to TOML (called from turkey.init start_service)

readonly CONF_DIR="/etc/turkey"
readonly CONF_FILE="$CONF_DIR/turkey.toml"
readonly DATA_DIR="/var/lib/turkey"

# TOML-escape: backslash then double-quote
toml_esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }

to_bool() {
	case "$1" in
		1|on|yes|true) echo "true" ;;
		*)             echo "false" ;;
	esac
}

sync_config() {
	local port log_level tls_domain mask tls_emulation ad_tag use_middle_proxy
	local classic secure tls

	port=$(uci -q get turkey.general.port);           port="${port:-8443}"
	log_level=$(uci -q get turkey.general.log_level);  log_level="${log_level:-normal}"
	tls_domain=$(uci -q get turkey.general.tls_domain); tls_domain="${tls_domain:-www.baidu.com}"
	mask=$(uci -q get turkey.general.mask);           mask=$(to_bool "${mask:-1}")
	tls_emulation=$(uci -q get turkey.general.tls_emulation); tls_emulation=$(to_bool "${tls_emulation:-1}")
	ad_tag=$(uci -q get turkey.general.ad_tag)
	use_middle_proxy=$(uci -q get turkey.general.use_middle_proxy); use_middle_proxy=$(to_bool "${use_middle_proxy:-0}")

	classic=$(uci -q get turkey.mode.classic);  classic=$(to_bool "${classic:-0}")
	secure=$(uci -q get turkey.mode.secure);    secure=$(to_bool "${secure:-0}")
	tls=$(uci -q get turkey.mode.tls);          tls=$(to_bool "${tls:-1}")

	# 收集所有用户
	local sections
	sections=$(uci -q show turkey | grep '\.secret=' | cut -d. -f2 | sort -u)
	local users_toml=""
	for s in $sections; do
		local name secret
		name=$(uci -q get "turkey.$s" 2>/dev/null)
		# 如果 section 名不是 user，用 name 字段
		[ -n "$name" ] || name=$(uci -q get "turkey.$s.name" 2>/dev/null)
		[ -n "$name" ] || name="$s"
		secret=$(uci -q get "turkey.$s.secret" 2>/dev/null)
		[ -n "$secret" ] && secret="$(toml_esc "$secret")"
		[ -n "$secret" ] && users_toml="${users_toml}${name} = \"${secret}\"\n"
	done
	[ -z "$users_toml" ] && users_toml='hello = "00000000000000000000000000000000"'

	# ad_tag 行
	local ad_tag_line=""
	[ -n "$ad_tag" ] && ad_tag_line="ad_tag = \"$(toml_esc "$ad_tag")\""

	mkdir -p "$CONF_DIR" "$DATA_DIR"

	cat > "$CONF_FILE" <<-TOML
		# Turkey (Telemt) 配置文件
		# 由 turkey-ctrl.sh 根据 UCI 自动生成

		[general]
		use_middle_proxy = ${use_middle_proxy}
		log_level = "${log_level}"
		fast_mode = true
		update_every = 43200
		${ad_tag_line}

		[general.modes]
		classic = ${classic}
		secure = ${secure}
		tls = ${tls}

		[network]
		ipv4 = true
		ipv6 = true
		prefer = 4
		multipath = false
		http_ip_detect_urls = ["https://api6.ipify.org"]

		[timeouts]
		client_first_byte_idle_secs = 300
		client_handshake = 60
		client_keepalive = 60
		client_ack = 300

		[server]
		listen_addr_ipv4 = "0.0.0.0"
		listen_addr_ipv6 = "::"

		[[server.listeners]]
		ip = "0.0.0.0"
		port = ${port}

		[[server.listeners]]
		ip = "::"
		port = ${port}

		[censorship]
		tls_domain = "${tls_domain}"
		mask = ${mask}
		mask_port = 443
		tls_emulation = ${tls_emulation}
		fake_cert_len = 2048
		tls_front_dir = "${DATA_DIR}/tlsfront"

		[access]
		user_max_tcp_conns_global_each = 0
		replay_check_len = 65536
		replay_window_secs = 120
		ignore_time_skew = false

		[access.users]
		$(printf '%b' "$users_toml")

		[[upstreams]]
		type = "direct"
		enabled = true
		weight = 10
	TOML
}

case "$1" in
	sync_config) sync_config ;;
esac
