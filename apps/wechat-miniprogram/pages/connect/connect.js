const deviceData = require('../../utils/device-data.js')

const channels = [
  {
    key: 'bluetooth',
    label: '蓝牙 BLE',
    sub: '近距离调试与绑定',
    badge: 'BLE',
    tone: 'blue'
  },
  {
    key: 'network',
    label: '5G/4G GPS 网络',
    sub: '公网定位与远程绑定',
    badge: '5G/4G',
    tone: 'green'
  }
]

const steps = [
  { key: 'scan', label: '扫描硬件' },
  { key: 'select', label: '选择设备' },
  { key: 'bind', label: '写入绑定' },
  { key: 'done', label: '完成入网' }
]

function normalizeDevice(item, channel) {
  return {
    ...item,
    channel,
    signalText: typeof item.rssi === 'number' ? item.rssi + ' dBm' : '--',
    deviceCode: item.imei || item.deviceId || item.id
  }
}

Page({
  data: {
    channels,
    steps,
    selectedChannel: 'bluetooth',
    scanning: false,
    binding: false,
    nearbyDevices: [],
    selectedDevice: null,
    bindStep: 0,
    bindResult: null,
    statusText: '等待扫描',
    statusSub: '选择蓝牙或 5G/4G GPS 通道后开始发现设备'
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
      return
    }
    wx.redirectTo({ url: '/pages/index/index' })
  },

  selectChannel(e) {
    const key = e.currentTarget.dataset.key
    if (key === this.data.selectedChannel || this.data.scanning || this.data.binding) return
    const channel = channels.find(item => item.key === key) || channels[0]
    this.setData({
      selectedChannel: key,
      nearbyDevices: [],
      selectedDevice: null,
      bindResult: null,
      bindStep: 0,
      statusText: channel.label + ' 已就绪',
      statusSub: channel.sub
    })
  },

  startScan() {
    if (this.data.scanning || this.data.binding) return
    const channel = this.data.selectedChannel
    const scanTask = channel === 'network'
      ? deviceData.scanNetworkDevices()
      : deviceData.scanBluetoothDevices()

    this.setData({
      scanning: true,
      selectedDevice: null,
      bindResult: null,
      bindStep: 1,
      statusText: '正在扫描',
      statusSub: channel === 'network' ? '正在发现 5G/4G GPS 在线硬件' : '正在发现附近 BLE 硬件'
    })

    scanTask.then(list => {
      const devices = (list || []).map(item => normalizeDevice(item, channel))
      this.setData({
        scanning: false,
        nearbyDevices: devices,
        bindStep: devices.length ? 1 : 0,
        statusText: devices.length ? '发现 ' + devices.length + ' 台设备' : '未发现设备',
        statusSub: devices.length ? '请选择要绑定的硬件设备' : '请确认设备已上电并处于配网模式'
      })
    }).catch(() => {
      this.setData({
        scanning: false,
        bindStep: 0,
        statusText: '扫描失败',
        statusSub: '请检查系统权限或稍后重试'
      })
      wx.showToast({ title: '扫描失败，请重试', icon: 'none' })
    })
  },

  selectDevice(e) {
    const id = e.currentTarget.dataset.id
    const selectedDevice = this.data.nearbyDevices.find(item => item.id === id)
    if (!selectedDevice || this.data.binding) return
    this.setData({
      selectedDevice,
      bindStep: 2,
      statusText: '已选择 ' + selectedDevice.name,
      statusSub: '确认后将写入本地绑定信息'
    })
  },

  bindDevice() {
    if (this.data.binding) return
    if (!this.data.selectedDevice) {
      wx.showToast({ title: '请先选择设备', icon: 'none' })
      return
    }

    const selectedDevice = this.data.selectedDevice
    const bindTask = this.data.selectedChannel === 'network'
      ? deviceData.bindNetworkDevice(selectedDevice)
      : deviceData.bindBluetoothDevice(selectedDevice)

    this.setData({
      binding: true,
      bindStep: 3,
      statusText: '正在绑定',
      statusSub: '正在写入设备编号与通信链路'
    })

    bindTask.then(result => {
      const bindResult = {
        ...(result || {}),
        channel: this.data.selectedChannel,
        name: selectedDevice.name,
        boundAt: Date.now()
      }
      wx.setStorageSync('lastBoundDevice', bindResult)
      this.setData({
        binding: false,
        bindStep: 4,
        bindResult,
        statusText: '绑定完成',
        statusSub: selectedDevice.name + ' 已完成入网配置'
      })
      wx.showToast({ title: '设备已绑定', icon: 'success' })
    }).catch(() => {
      this.setData({
        binding: false,
        bindStep: 2,
        statusText: '绑定失败',
        statusSub: '请检查设备状态后重新绑定'
      })
      wx.showToast({ title: '绑定失败，请重试', icon: 'none' })
    })
  }
})
