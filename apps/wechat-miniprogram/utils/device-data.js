const mock = require('./mock.js')

const bluetoothConfig = {
  useRealBluetooth: false,
  discoveryDuration: 1800,
  serviceId: '',
  characteristicId: ''
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

function distanceFromRssi(rssi) {
  if (typeof rssi !== 'number') return '未知'
  if (rssi >= -50) return '约 1m'
  if (rssi >= -65) return '约 3m'
  return '约 6m+'
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

function configureDeviceData(options) {
  Object.assign(bluetoothConfig, options || {})
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
        .filter(item => item.name || item.localName)
        .map(item => normalizeBluetoothDevice(item))
    })
    .catch(error => {
      wxPromise('stopBluetoothDevicesDiscovery').catch(() => {})
      throw error
    })
}

function connectRealBluetoothDevice(device) {
  const target = normalizeBluetoothDevice(device || {})
  if (!target.deviceId) {
    return Promise.reject(new Error('missing bluetooth deviceId'))
  }

  return wxPromise('createBLEConnection', { deviceId: target.deviceId })
    .then(() => syncBoundDevice(target))
    .then(result => ({
      success: true,
      deviceId: target.deviceId,
      serviceId: bluetoothConfig.serviceId,
      characteristicId: bluetoothConfig.characteristicId,
      message: result.message || '蓝牙设备已连接'
    }))
}

function syncBoundDevice(device) {
  return Promise.resolve({
    success: true,
    deviceId: device.deviceId,
    message: '蓝牙设备已连接'
  })
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
  getDevices,
  scanBluetoothDevices,
  bindBluetoothDevice,
  scanNetworkDevices,
  bindNetworkDevice,
  scanRealBluetoothDevices,
  connectRealBluetoothDevice,
  runNearbyDiagnosis
}
