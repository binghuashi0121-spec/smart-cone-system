# Integration Notes

This document is a placeholder for the future integration between the WeChat mini program and the ESP32 GPS firmware.

## Current Responsibilities

- Mini program: scan, connect, bind, and eventually read GPS data from smart cone devices.
- ESP32 firmware: read GPS data from UART, parse NMEA data, and expose device data through BLE GATT advertising or notification.

## Not Defined Yet

- Final BLE service UUIDs and characteristic UUIDs.
- GPS payload format.
- Device identity and binding protocol.
- Error handling, reconnect behavior, and offline state rules.

These details should be confirmed during hardware and mini program joint debugging before they are treated as stable interfaces.
