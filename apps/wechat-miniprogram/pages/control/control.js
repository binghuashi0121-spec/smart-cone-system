const mock = require('../../utils/mock.js')

const navItems = mock.navItems.map(item => ({
  ...item,
  iconPath: `/assets/icons/pages/control/nav-${item.page === 'index' ? 'home' : item.page === 'control' ? 'control' : 'device'}.svg`
}))

const modeLabels = {
  normal: '常规施工',
  night: '夜间增强',
  fog: '雨雾警示',
  emergency: '事故应急',
  silent: '静音警示'
}

const modeToneClasses = {
  normal: 'neutral',
  night: 'night',
  fog: 'fog',
  emergency: 'danger',
  silent: 'neutral'
}

function modeMeta(key) {
  return {
    key,
    label: modeLabels[key] || modeLabels.night,
    toneClass: modeToneClasses[key] || modeToneClasses.night
  }
}

function deviceTone(item) {
  if (!item.online) return 'offline'
  if (item.status === 'tilted') return 'tilted'
  if (item.id === 'C07' || item.status === 'alert') return 'shifted'
  if (item.status === 'lowBattery' && item.battery > 0 && item.battery < 20) return 'low'
  return 'normal'
}

function deviceStatusMeta(item) {
  const tone = deviceTone(item)
  const map = {
    normal: { statusLabel: '正常', healthLabel: '正常', healthClass: 'normal' },
    low: { statusLabel: '低电量', healthLabel: '异常', healthClass: 'abnormal' },
    shifted: { statusLabel: '位置偏移', healthLabel: '异常', healthClass: 'abnormal' },
    tilted: { statusLabel: '倾倒异常', healthLabel: '异常', healthClass: 'abnormal' },
    offline: { statusLabel: '离线', healthLabel: '异常', healthClass: 'abnormal' }
  }
  return {
    tone,
    ...(map[tone] || map.normal)
  }
}

function controlDevice(item) {
  const meta = deviceStatusMeta(item)
  return {
    ...item,
    ...meta,
    iconPath: '/assets/icons/pages/control/single-device.svg',
    onlineLabel: item.online ? '在线' : '离线',
    batteryLabel: item.battery + '%',
    signalLabel: item.signal + '格',
    groupArea: item.group + ' · ' + item.area
  }
}

const controlDevices = mock.cones.map(item => controlDevice(item))

const deviceFilters = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'abnormal', label: '异常' },
  { key: 'low', label: '低电量' },
  { key: 'shifted', label: '位置偏移' },
  { key: 'tilted', label: '倾倒' },
  { key: 'offline', label: '离线' }
]

function filterControlDevices(filterKey) {
  if (filterKey === 'normal') return controlDevices.filter(item => item.tone === 'normal')
  if (filterKey === 'abnormal') return controlDevices.filter(item => item.tone !== 'normal' && item.tone !== 'offline')
  if (filterKey === 'low') return controlDevices.filter(item => item.tone === 'low')
  if (filterKey === 'shifted') return controlDevices.filter(item => item.tone === 'shifted')
  if (filterKey === 'tilted') return controlDevices.filter(item => item.tone === 'tilted')
  if (filterKey === 'offline') return controlDevices.filter(item => item.tone === 'offline')
  return controlDevices
}

function deviceStats() {
  const normal = controlDevices.filter(item => item.tone === 'normal').length
  const offline = controlDevices.filter(item => item.tone === 'offline').length
  return {
    total: controlDevices.length,
    normal,
    abnormal: controlDevices.length - normal - offline,
    offline
  }
}

function findDevice(id) {
  return controlDevices.find(item => item.id === id) || controlDevices.find(item => item.id === 'C07') || controlDevices[0]
}

function deviceMeta(id) {
  const device = findDevice(id)
  if (!device) {
    return {
      selectedDevice: null,
      selectedDeviceId: '',
      selectedDeviceStatus: '未选择设备',
      selectedDeviceBattery: '--'
    }
  }
  return {
    selectedDevice: device,
    selectedDeviceId: device.id,
    selectedDeviceStatus: device.online ? '在线 · ' + device.statusLabel : '离线 · ' + device.statusLabel,
    selectedDeviceBattery: device.batteryLabel
  }
}

function initialWarningMode() {
  const appMode = getApp().globalData.warningMode
  const storageMode = wx.getStorageSync('warningMode')
  return modeLabels[appMode] ? appMode : modeLabels[storageMode] ? storageMode : 'night'
}

Page({
  data: {
    currentPage: 'control',
    navItems,
    task: mock.task,
    selectedScope: 'all',
    selectedMode: initialWarningMode(),
    selectedModeMeta: modeMeta(initialWarningMode()),
    showDevicePicker: false,
    deviceFilter: 'all',
    deviceFilters,
    controlDevices,
    filteredControlDevices: filterControlDevices('all'),
    deviceStats: deviceStats(),
    ledOn: true,
    brightness: 80,
    flashRate: 'medium',
    strobeOn: true,
    soundOn: true,
    volume: 70,
    soundTypes: ['警笛声', '蜂鸣声', '语音提示', '短促警报'],
    soundIndex: 0,
    noiseReduce: true,
    feedback: '已向18台设备发送指令',
    feedbackSub: '17台执行成功，1台离线',
    ...deviceMeta('C07'),
    scopes: [
      { key: 'all', iconPath: '/assets/icons/pages/control/all-cones.svg', title: '全部路锥', sub: '' },
      { key: 'single', iconPath: '/assets/icons/pages/control/single-device.svg', title: '单设备', sub: '' }
    ],
    modes: [
      { key: 'normal', iconPath: '/assets/icons/pages/control/normal-work.svg', title: '常规施工', sub: '白天施工常规警示' },
      { key: 'night', iconPath: '/assets/icons/pages/control/night-mode.svg', title: '夜间增强', sub: '夜间可视增强模式' },
      { key: 'fog', iconPath: '/assets/icons/pages/control/rain-fog.svg', title: '雨雾警示', sub: '雨雾天气高亮警示' },
      { key: 'emergency', iconPath: '/assets/icons/pages/control/accident-emergency.svg', title: '事故应急', sub: '紧急事故高强度警示', danger: true },
      { key: 'silent', iconPath: '/assets/icons/pages/control/silent-mode.svg', title: '静音警示', sub: '仅灯光警示，静音模式' }
    ]
  },

  onLoad(options) {
    const device = options.device || getApp().globalData.selectedDeviceId
    if (device) {
      this.setData({
        ...deviceMeta(device),
        selectedScope: 'single',
        feedback: '已进入' + device + '单设备控制',
        feedbackSub: '当前仅调整该设备参数'
      })
    }
  },

  switchTab(e) {
    const url = e.currentTarget.dataset.url
    if (url && url !== '/pages/control/control') {
      wx.redirectTo({ url })
    }
  },

  selectScope(e) {
    const key = e.currentTarget.dataset.key
    this.setData({
      selectedScope: key,
      showDevicePicker: key === 'single',
      feedback: key === 'single' ? '已进入' + this.data.selectedDeviceId + '单设备控制' : '已向18台设备发送指令',
      feedbackSub: key === 'single' ? '当前仅调整该设备参数' : '17台执行成功，1台离线'
    })
  },

  openDevicePicker() {
    this.setData({ showDevicePicker: true })
  },

  closeDevicePicker() {
    this.setData({ showDevicePicker: false })
  },

  selectDeviceFilter(e) {
    const key = e.currentTarget.dataset.key || 'all'
    this.setData({
      deviceFilter: key,
      filteredControlDevices: filterControlDevices(key)
    })
  },

  selectDevice(e) {
    const id = e.currentTarget.dataset.id
    const meta = deviceMeta(id)
    getApp().globalData.selectedDeviceId = meta.selectedDeviceId
    this.setData({
      ...meta,
      selectedScope: 'single',
      showDevicePicker: false,
      feedback: '已选择' + meta.selectedDeviceId + '单设备控制',
      feedbackSub: meta.selectedDevice && !meta.selectedDevice.online ? '设备离线，参数将暂存并在恢复连接后同步' : '当前仅调整该设备参数'
    })
  },

  selectMode(e) {
    const key = e.currentTarget.dataset.key
    const mode = this.data.modes.find(item => item.key === key)
    this.setData({
      selectedMode: key,
      selectedModeMeta: modeMeta(key)
    })
    wx.showToast({ title: '已切换至' + mode.title, icon: 'none' })
  },

  onLedChange(e) {
    this.setData({ ledOn: e.detail.value })
  },

  onBrightness(e) {
    this.setData({ brightness: e.detail.value })
  },

  selectFlash(e) {
    this.setData({ flashRate: e.currentTarget.dataset.rate })
  },

  onStrobeChange(e) {
    this.setData({ strobeOn: e.detail.value })
  },

  onSoundChange(e) {
    this.setData({ soundOn: e.detail.value })
  },

  onVolume(e) {
    this.setData({ volume: e.detail.value })
  },

  onSoundType(e) {
    this.setData({ soundIndex: Number(e.detail.value) })
  },

  onNoiseChange(e) {
    this.setData({ noiseReduce: e.detail.value })
  },

  sendCommand() {
    if (this.data.selectedScope === 'single') {
      const selectedDevice = this.data.selectedDevice || findDevice(this.data.selectedDeviceId)
      const isOffline = selectedDevice && !selectedDevice.online
      this.setData({
        feedback: isOffline ? this.data.selectedDeviceId + '离线，指令已暂存' : '已向' + this.data.selectedDeviceId + '下发单设备指令',
        feedbackSub: isOffline ? '恢复连接后将自动同步灯光与声音参数' : '定位、灯光与声音参数已单独同步'
      })
      wx.showToast({ title: isOffline ? '离线设备指令已暂存' : '单设备指令已下发', icon: isOffline ? 'none' : 'success' })
      return
    }
    const selectedMode = this.data.selectedMode
    getApp().globalData.warningMode = selectedMode
    wx.setStorageSync('warningMode', selectedMode)
    this.setData({
      feedback: '已向18台设备发送指令',
      feedbackSub: modeLabels[selectedMode] + '已同步到首页地图场景'
    })
    wx.showToast({ title: '控制指令已下发', icon: 'success' })
  },

  viewFeedback() {
    wx.showToast({ title: '正在查看执行明细', icon: 'none' })
  }
})
