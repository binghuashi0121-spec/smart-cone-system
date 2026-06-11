# Smart Cone System

This repository is a monorepo for the smart traffic cone system. It currently contains the WeChat mini program and the ESP32 GPS firmware as separate subprojects so they can be developed and debugged together later.

## Projects

- `apps/wechat-miniprogram/`: WeChat mini program for smart traffic cone display, binding, and control pages.
- `firmware/esp32-gps/`: ESP-IDF firmware for ESP32 GPS and BLE-related functionality.
- `docs/integration.md`: Placeholder notes for the future mini program and ESP32 integration.

## WeChat Mini Program

Open this directory in WeChat DevTools:

```text
apps/wechat-miniprogram
```

The private WeChat DevTools config file `project.private.config.json` is intentionally ignored and should remain local.

## ESP32 GPS Firmware

Build from the firmware directory with an existing ESP-IDF environment:

```bash
cd firmware/esp32-gps
idf.py set-target esp32
idf.py build
```

If the actual board uses another chip, replace `esp32` with the matching ESP-IDF target, such as `esp32c3` or `esp32s3`.

## Current Scope

This initial repository setup only organizes the two codebases into one repository. It does not change the mini program logic, the ESP32 firmware logic, or define the final BLE/GPS data protocol.
