# openwrt-turkey

Turkey — [Telemt](https://github.com/telemt/telemt) MTProxy 的 OpenWrt 插件包

## 包结构

```
openwrt-turkey/
├── turkey/          # 守护进程包（init, UCI, TOML 配置）
└── luci-app-turkey/ # LuCI 界面包（配置页、日志页、RPC、ACL）
```

## 安装

将两个包放到 OpenWrt 源码的 `package/` 目录下，然后编译：

```bash
make package/turkey/compile V=w
make package/luci-app-turkey/compile V=w
```

编译产物在 `bin/packages/<arch>/base/`。

## 使用

LuCI 路径：`服务 → Turkey`  
支持 Classic / Secure (dd) / Fake-TLS (ee) 三种模式。

## 依赖

- x86_64 或 aarch64 架构
- OpenWrt 25.12+ (APK)
- 预编译二进制从 [telemt Releases](https://github.com/telemt/telemt/releases) 自动下载
