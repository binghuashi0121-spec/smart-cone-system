const mock = require('./mock.js')

const bluetoothConfig = {
  useRealBluetooth: true,
  discoveryDuration: 1800,
  serviceId: '0000FFE0-0000-1000-8000-00805F9B34FB',
  characteristicId: '0000FFE1-0000-1000-8000-00805F9B34FB',
  controlCharacteristicId: '0000FFE2-0000-1000-8000-00805F9B34FB',
  deviceInfoCharacteristicId: '0000FFE3-0000-1000-8000-00805F9B34FB'
}

const bleState = {
  connectedDeviceId: '',
  connectedDeviceName: '',
  serviceId: '',
  notifyCharacteristicId: '',
  controlCharacteristicId: '',
  listenerReady: false
}

const bluetoothMockDevices = [
  { id: 'ble-024', name: 'STC-CONE-024', rssi: -42, distance: '约 1.8m', status: '可连接' },
  { id: 'ble-025', name: 'STC-CONE-025', rssi: -56, distance: '约 3.4m', status: '可连接' },
  { id: 'ble-031', name: 'STC-CONE-031', rssi: -71, distance: '约 6.2m', status: '信号弱' }
]

const networkMockDevices = [
  { id: 'net-5g-024', name: 'STC-5G-CONE-024', rssi: -61, distance: '公网在线', status: '待入网', imei: '861536040002401' },
  { id: 'net-5g-025', name: 'STC-5G-CONE-025', rssi: -68, distance: '公网在线', status: '待入网', imei: '861536040002402' },
  { id: 'net-nb-031', name: 'STC-NB-CONE-031', rssi: -76, distance: 'NB-IoT', status: '信号弱', imei: '861536040002403' }
]

function cloneList(list) {
  return list.map(item => ({ ...item }))
}

function resolveLater(data, delay) {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay)
  })
}

function wxPromise(method, options) {
  return new Promise((resolve, reject) => {
    if (typeof wx === 'undefined' || typeof wx[method] !== 'function') {
      reject(new Error(method + ' is not available'))
      return
    }
    wx[method]({
      ...(options || {}),
      success: resolve,
      fail: reject
    })
  })
}

function wait(delay) {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}

function normalizeUuid(uuid) {
  return String(uuid || '').toUpperCase()
}

function distanceFromRssi(rssi) {
  if (typeof rssi !== 'number') return '未知'
  if (rssi >= -50) return '约 1m'
  if (rssi >= -65) return '约 3m'
  return '约 6m+'
}

function isConeBleDevice(device) {
  const name = device && (device.name || device.localName || '')
  return name.indexOf('STC-CONE') !== -1 || name.indexOf('ESP_GPS') !== -1
}

function normalizeBluetoothDevice(device) {
  const name = device.name || device.localName || '未知蓝牙设备'
  const rssi = typeof device.RSSI === 'number' ? device.RSSI : device.rssi
  return {
    id: device.deviceId || device.id,
    deviceId: device.deviceId || device.id,
    name,
    rssi,
    distance: device.distance || distanceFromRssi(rssi),
    status: rssi < -70 ? '信号弱' : '可连接',
    raw: device
  }
}

function ab2str(buffer) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer))
}

function str2ab(str) {
  const buffer = new ArrayBuffer(str.length)
  const dataView = new Uint8Array(buffer)
  for (let i = 0; i < str.length; i += 1) {
    dataView[i] = str.charCodeAt(i)
  }
  return buffer
}

function getGlobalData() {
  const app = typeof getApp === 'function' ? getApp() : null
  return app ? app.globalData : null
}

function ensureGlobalBleStore() {
  const globalData = getGlobalData()
  if (!globalData) return null
  if (!globalData.deviceGpsData) globalData.deviceGpsData = {}
  return globalData
}

function updateConnectionState(connected, deviceId) {
  const globalData = ensureGlobalBleStore()
  if (!globalData) return
  globalData.bleConnected = connected
  if (!connected && deviceId && globalData.deviceGpsData[deviceId]) {
    globalData.deviceGpsData[deviceId] = {
      ...globalData.deviceGpsData[deviceId],
      online: false,
      locating: false,
      updatedAt: Date.now()
    }
  }
}

function saveGpsData(deviceId, payload) {
  const globalData = ensureGlobalBleStore()
  if (!globalData || !deviceId) return
  const hasFix = payload.fix === 'A' && typeof payload.lat === 'number' && typeof payload.lon === 'number'
  globalData.deviceGpsData[deviceId] = {
    ...(globalData.deviceGpsData[deviceId] || {}),
    deviceId,
    name: bleState.connectedDeviceName,
    lat: payload.lat,
    lon: payload.lon,
    fix: payload.fix || 'V',
    bat: typeof payload.bat === 'number' ? payload.bat : undefined,
    online: true,
    locating: !hasFix,
    updatedAt: Date.now()
  }
}

function setupBleListeners() {
  if (bleState.listenerReady || typeof wx === 'undefined') return
  if (typeof wx.onBLECharacteristicValueChange === 'function') {
    wx.onBLECharacteristicValueChange(res => {
      if (!res || normalizeUuid(res.characteristicId) !== normalizeUuid(bleState.notifyCharacteristicId)) return
      try {
        const text = ab2str(res.value)
        const payload = JSON.parse(text)
        saveGpsData(res.deviceId || bleState.connectedDeviceId, payload)
      } catch (error) {
        console.warn('parse ble gps data failed', error)
      }
    })
  }
  if (typeof wx.onBLEConnectionStateChange === 'function') {
    wx.onBLEConnectionStateChange(res => {
      if (!res || res.deviceId !== bleState.connectedDeviceId) return
      updateConnectionState(!!res.connected, res.deviceId)
      if (!res.connected) {
        bleState.connectedDeviceId = ''
      }
    })
  }
  bleState.listenerReady = true
}

function configureDeviceData(options) {
  Object.assign(bluetoothConfig, options || {})
}

function getBluetoothConfig() {
  return { ...bluetoothConfig }
}

function getDevices() {
  return cloneList(mock.cones)
}

function scanBluetoothDevices() {
  if (bluetoothConfig.useRealBluetooth) {
    return scanRealBluetoothDevices()
  }
  return resolveLater(cloneList(bluetoothMockDevices), 700)
}

function bindBluetoothDevice(device) {
  if (bluetoothConfig.useRealBluetooth) {
    return connectRealBluetoothDevice(device)
  }
  return resolveLater({
    success: true,
    deviceId: device && device.id,
    message: '蓝牙设备已绑定'
  }, 260)
}

function scanNetworkDevices() {
  return resolveLater(cloneList(networkMockDevices), 760)
}

function bindNetworkDevice(device) {
  return resolveLater({
    success: true,
    deviceId: device && device.id,
    imei: device && device.imei,
    message: '5G/NB 设备已绑定'
  }, 320)
}

function scanRealBluetoothDevices() {
  return wxPromise('openBluetoothAdapter')
    .then(() => wxPromise('startBluetoothDevicesDiscovery', {
      allowDuplicatesKey: false,
      services: bluetoothConfig.serviceId ? [bluetoothConfig.serviceId] : []
    }))
    .then(() => wait(bluetoothConfig.discoveryDuration))
    .then(() => wxPromise('getBluetoothDevices'))
    .then(result => {
      wxPromise('stopBluetoothDevicesDiscovery').catch(() => {})
      return (result.devices || [])
        .filter(item => (item.name || item.localName) && isConeBleDevice(item))
        .map(item => normalizeBluetoothDevice(item))
    })
    .catch(error => {
      wxPromise('stopBluetoothDevicesDiscovery').catch(() => {})
      throw error
    })
}

function findService(services) {
  const targetId = normalizeUuid(bluetoothConfig.serviceId)
  return (services || []).find(item => normalizeUuid(item.uuid) === targetId)
}

function findCharacteristic(characteristics, uuid, propName) {
  const targetId = normalizeUuid(uuid)
  return (characteristics || []).find(item => normalizeUuid(item.uuid) === targetId)
    || (characteristics || []).find(item => item.properties && item.properties[propName])
}

function connectRealBluetoothDevice(device) {
  const target = normalizeBluetoothDevice(device || {})
  if (!target.deviceId) {
    return Promise.reject(new Error('missing bluetooth deviceId'))
  }

  setupBleListeners()
  return wxPromise('openBluetoothAdapter')
    .then(() => wxPromise('createBLEConnection', { deviceId: target.deviceId }))
    .then(() => wxPromise('getBLEDeviceServices', { deviceId: target.deviceId }))
    .then(serviceResult => {
      const service = findService(serviceResult.services)
      if (!service) throw new Error('target BLE service not found')
      bleState.serviceId = service.uuid
      return wxPromise('getBLEDeviceCharacteristics', {
        deviceId: target.deviceId,
        serviceId: service.uuid
      })
    })
    .then(charResult => {
      const notifyChar = findCharacteristic(charResult.characteristics, bluetoothConfig.characteristicId, 'notify')
      const controlChar = findCharacteristic(charResult.characteristics, bluetoothConfig.controlCharacteristicId, 'write')
      if (!notifyChar) throw new Error('notify characteristic not found')
      if (!controlChar) throw new Error('control characteristic not found')
      bleState.connectedDeviceId = target.deviceId
      bleState.connectedDeviceName = target.name
      bleState.notifyCharacteristicId = notifyChar.uuid
      bleState.controlCharacteristicId = controlChar.uuid
      return wxPromise('notifyBLECharacteristicValueChange', {
        deviceId: target.deviceId,
        serviceId: bleState.serviceId,
        characteristicId: notifyChar.uuid,
        state: true
      })
    })
    .then(() => {
      const globalData = ensureGlobalBleStore()
      if (globalData) {
        globalData.deviceGpsData[target.deviceId] = {
          ...(globalData.deviceGpsData[target.deviceId] || {}),
          deviceId: target.deviceId,
          name: target.name,
          online: true,
          locating: true,
          updatedAt: Date.now()
        }
      }
      updateConnectionState(true, target.deviceId)
      return {
        success: true,
        deviceId: target.deviceId,
        serviceId: bleState.serviceId,
        characteristicId: bleState.notifyCharacteristicId,
        controlCharacteristicId: bleState.controlCharacteristicId,
        message: '蓝牙设备已连接'
      }
    })
}

function writeControlCommand(command, deviceId) {
  if (!bluetoothConfig.useRealBluetooth) {
    return resolveLater({ success: true, mock: true }, 120)
  }
  const targetDeviceId = deviceId || bleState.connectedDeviceId
  if (!targetDeviceId || !bleState.serviceId || !bleState.controlCharacteristicId) {
    return Promise.reject(new Error('BLE device is not connected'))
  }
  const payload = typeof command === 'string' ? command : JSON.stringify(command)
  return wxPromise('writeBLECharacteristicValue', {
    deviceId: targetDeviceId,
    serviceId: bleState.serviceId,
    characteristicId: bleState.controlCharacteristicId,
    value: str2ab(payload)
  }).then(() => ({ success: true, deviceId: targetDeviceId, payload }))
}

function runNearbyDiagnosis() {
  return resolveLater({
    nearbyCount: bluetoothMockDevices.length,
    bluetooth: '已开启',
    network: '在线',
    location: '定位正常',
    cloud: '已同步',
    healthText: '链路正常',
    checkedAt: '刚刚'
  }, 520)
}

module.exports = {
  configureDeviceData,
  getBluetoothConfig,
  getDevices,
  scanBluetoothDevices,
  bindBluetoothDevice,
  scanNetworkDevices,
  bindNetworkDevice,
  scanRealBluetoothDevices,
  connectRealBluetoothDevice,
  writeControlCommand,
  runNearbyDiagnosis,
  ab2str
}
