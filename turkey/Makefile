# SPDX-License-Identifier: MIT
#
# Turkey — Telemt MTProxy Server
# 从 GitHub Releases 按目标架构下载预编译 musl 静态二进制

include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/package.mk

PKG_NAME    := turkey
PKG_VERSION := 3.4.11
PKG_RELEASE := 1

PKG_LICENSE    := MIT
PKG_MAINTAINER := Pi <pi@example.com>

# ── 架构映射：OpenWrt ARCH → telemt release tarball ──────────────
# telemt 仅提供 x86_64 和 aarch64 的 musl/gln 预编译包
ifeq ($(ARCH),x86_64)
  TL_TARGET := x86_64-linux-musl
else ifeq ($(ARCH),aarch64)
  TL_TARGET := aarch64-linux-musl
else
  TL_TARGET :=
endif

TL_TARBALL  := telemt-$(TL_TARGET).tar.gz
TL_DL_URL   := https://github.com/telemt/telemt/releases/download/$(PKG_VERSION)/$(TL_TARBALL)

define Package/turkey
  SECTION   := net
  CATEGORY  := Network
  TITLE     := Turkey (Telemt MTProxy)
  URL       := https://github.com/telemt/telemt
  DEPENDS   :=
endef

define Package/turkey/description
  Telemt — 快速、安全的 MTProxy 服务器（Rust 实现）。
  支持 Classic / Secure (dd) / Fake-TLS (ee) 模式，
  内置 TLS fronting 和流量伪装。
endef

define Package/turkey/conffiles
/etc/config/turkey
/etc/turkey/turkey.toml
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	# 构建期架构检查
	[ -n "$(TL_TARGET)" ] || { \
		echo "Turkey: 不支持的架构 $(ARCH)，支持：x86_64 aarch64" >&2; \
		exit 1; \
	}
	# 下载 tarball
	if [ ! -f "$(DL_DIR)/$(TL_TARBALL)" ]; then \
		echo "Turkey: 下载 $(TL_DL_URL)"; \
		curl -fsSL --retry 3 \
			-o "$(DL_DIR)/$(TL_TARBALL).tmp" \
			"$(TL_DL_URL)" \
		&& mv "$(DL_DIR)/$(TL_TARBALL).tmp" "$(DL_DIR)/$(TL_TARBALL)"; \
	fi
	# 解压 tarball
	tar -xzf "$(DL_DIR)/$(TL_TARBALL)" -C "$(PKG_BUILD_DIR)"
	# 改名为 turkey
	mv "$(PKG_BUILD_DIR)/telemt" "$(PKG_BUILD_DIR)/turkey"
endef

define Build/Compile
endef

define Package/turkey/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/turkey $(1)/usr/bin/turkey

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(CURDIR)/files/turkey.init $(1)/etc/init.d/turkey

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(CURDIR)/files/turkey.config $(1)/etc/config/turkey

	$(INSTALL_DIR) $(1)/etc/turkey
	$(INSTALL_CONF) $(CURDIR)/files/turkey.toml $(1)/etc/turkey/turkey.toml

	$(INSTALL_DIR) $(1)/usr/libexec
	$(INSTALL_BIN) $(CURDIR)/files/turkey-ctrl.sh $(1)/usr/libexec/turkey-ctrl.sh

	$(INSTALL_DIR) $(1)/var/lib/turkey
endef

define Package/turkey/postinst
#!/bin/sh
[ -z "${IPKG_INSTROOT}" -a -f /usr/libexec/turkey-ctrl.sh ] && chmod +x /usr/libexec/turkey-ctrl.sh
exit 0
endef

define Package/turkey/prerm
#!/bin/sh
[ -z "$${IPKG_INSTROOT}" ] && {
	[ -x /etc/init.d/turkey ] && {
		/etc/init.d/turkey stop    2>/dev/null || true
		/etc/init.d/turkey disable 2>/dev/null || true
	}
}
exit 0
endef

$(eval $(call BuildPackage,turkey))
