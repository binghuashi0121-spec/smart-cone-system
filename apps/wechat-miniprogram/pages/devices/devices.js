const mock = require('../../utils/mock.js')
const deviceData = require('../../utils/device-data.js')

const navItems = mock.navItems.map(item => ({
  ...item,
  iconPath: `/assets/icons/pages/devices/nav-${item.page === 'index' ? 'home' : item.page === 'control' ? 'control' : 'device'}.svg`
}))

const dashboardStats = [
  { key: 'total', label: '总设备', value: 120, unit: '', tone: 'blue' },
  { key: 'online', label: '在线', value: 116, unit: '', tone: 'green' },
  { key: 'abnormal', label: '异常', value: 4, unit: '', tone: 'warning' },
  { key: 'offline', label: '离线', value: 0, unit: '', tone: 'offline' }
]

const bottomStats = [
  { label: '正常', value: 116, tone: 'normal' },
  { label: '异常', value: 4, tone: 'warning' },
  { label: '故障', value: 0, tone: 'fault' },
  { label: '离线', value: 0, tone: 'offline' }
]

const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'normal', label: '正常' },
  { key: 'warning', label: '异常' },
  { key: 'fault', label: '故障' },
  { key: 'offline', label: '离线' }
]

const groupFilters = [
  { key: 'all', label: '全部区域' },
  { key: 'A组', label: 'A组' },
  { key: 'B组', label: 'B组' },
  { key: 'C组', label: 'C组' }
]

const sortOptions = [
  { key: 'default', label: '默认排序' },
  { key: 'batteryAsc', label: '电量低优先' },
  { key: 'batteryDesc', label: '电量高优先' },
  { key: 'onlineFirst', label: '在线优先' },
  { key: 'offlineFirst', label: '离线优先' }
]

function deviceTone(item) {
  if (!item.online) return 'offline'
  if (item.status === 'tilted') return 'tilted'
  if (item.id === 'C07' || item.id === 'C12' || item.status === 'alert') return 'shifted'
  if (item.status === 'lowBattery' && item.battery > 0 && item.battery < 20) return 'low'
  return 'normal'
}

function toneMeta(tone) {
  const map = {
    low: {
      stateText: '低电量预警',
      stateClass: 'warning',
      operationText: '低电量',
      iconPath: '/assets/icons/pages/devices/traffic-cone-alert.svg',
      locationStatus: '定位正常',
      bluetoothStatus: '已连接',
      connection: 'BLE + 4G'
    },
    shifted: {
      stateText: '位置偏移',
      stateClass: 'warning',
      operationText: '位置偏移',
      iconPath: '/assets/icons/pages/devices/traffic-cone-alert.svg',
      locationStatus: '位置需校正',
      bluetoothStatus: '已连接',
      connection: 'BLE + 4G'
    },
    tilted: {
      stateText: '倾倒异常',
      stateClass: 'fault',
      operationText: '倾倒异常',
      iconPath: '/assets/icons/pages/devices/traffic-cone-alert.svg',
      locationStatus: '定位正常',
      bluetoothStatus: '已连接',
      connection: 'BLE + 4G'
    },
    offline: {
      stateText: '设备离线',
      stateClass: 'offline',
      operationText: '设备离线',
      iconPath: '/assets/icons/pages/devices/traffic-cone-offline.svg',
      locationStatus: '未定位',
      bluetoothStatus: '未连接',
      connection: '离线'
    },
    normal: {
      stateText: '运行正常',
      stateClass: 'normal',
      operationText: '运行正常',
      iconPath: '/assets/icons/pages/devices/traffic-cone-normal.svg',
      locationStatus: '定位正常',
      bluetoothStatus: '已连接',
      connection: 'BLE + 4G'
    }
  }
  return map[tone] || map.normal
}

function statusBucket(tone) {
  if (tone === 'normal') return 'normal'
  if (tone === 'offline') return 'offline'
  if (tone === 'tilted') return 'fault'
  return 'warning'
}

function deviceSummary(item, expandedDeviceId) {
  const tone = deviceTone(item)
  const meta = toneMeta(tone)
  return {
    ...item,
    ...meta,
    tone,
    statusBucket: statusBucket(tone),
    groupArea: item.group + ' · ' + item.area,
    batteryDisplay: item.online ? item.battery + '%' : '--',
    batteryWidth: item.online ? item.battery : 0,
    signalLevel: item.online ? item.signal : 0,
    lastSync: item.online ? '10秒前' : '3分钟前',
    expanded: item.id === expandedDeviceId
  }
}

function buildDeviceList(expandedDeviceId) {
  return deviceData.getDevices().map(item => deviceSummary(item, expandedDeviceId))
}

function applyDeviceFilters(devices, keyword, statusFilter, groupFilter, sortMode) {
  const query = (keyword || '').trim().toLowerCase()
  let result = devices.filter(item => {
    const matchedKeyword = !query ||
      item.id.toLowerCase().indexOf(query) > -1 ||
      item.area.toLowerCase().indexOf(query) > -1 ||
      item.groupArea.toLowerCase().indexOf(query) > -1
    const matchedStatus = statusFilter === 'all' || item.statusBucket === statusFilter
    const matchedGroup = groupFilter === 'all' || item.group === groupFilter
    return matchedKeyword && matchedStatus && matchedGroup
  })

  result = result.slice()
  if (sortMode === 'batteryAsc') {
    result.sort((a, b) => a.battery - b.battery)
  } else if (sortMode === 'batteryDesc') {
    result.sort((a, b) => b.battery - a.battery)
  } else if (sortMode === 'onlineFirst') {
    result.sort((a, b) => Number(b.online) - Number(a.online))
  } else if (sortMode === 'offlineFirst') {
    result.sort((a, b) => Number(a.online) - Number(b.online))
  }

  return result
}

function diagnosisItems(report) {
  return [
    { label: '蓝牙', value: report.bluetooth, tone: 'blue' },
    { label: '网络', value: report.network, tone: 'green' },
    { label: '定位', value: report.location, tone: 'green' },
    { label: '云端', value: report.cloud, tone: 'blue' }
  ]
}

Page({
  data: {
    currentPage: 'devices',
    navItems,
    dashboardStats,
    bottomStats,
    statusFilters,
    groupFilters,
    sortOptions,
    signalBars: [1, 2, 3, 4, 5],
    devices: buildDeviceList(''),
    filteredDevices: applyDeviceFilters(buildDeviceList(''), '', 'all', 'all', 'default'),
    searchKeyword: '',
    statusFilter: 'all',
    groupFilter: 'all',
    sortMode: 'default',
    showFilterPanel: false,
    showSortPanel: false,
    expandedDeviceId: '',
    steps: [
      { text: '开启蓝牙', hasNext: true },
      { text: '扫描设备', hasNext: true },
      { text: '绑定编号', hasNext: true },
      { text: '加入分组', hasNext: false }
    ],
    showBluetoothSheet: false,
    bluetoothStep: 1,
    bluetoothScanning: false,
    bluetoothDevices: [],
    selectedBluetoothDevice: null,
    diagnosisRunning: false,
    diagnosisSummary: '',
    diagnosisItems: []
  },

  switchTab(e) {
    const url = e.currentTarget.dataset.url
    if (url && url !== '/pages/devices/devices') {
      wx.redirectTo({ url })
    }
  },

  refreshDevices(extra) {
    const update = extra || {}
    const expandedDeviceId = Object.prototype.hasOwnProperty.call(update, 'expandedDeviceId')
      ? update.expandedDeviceId
      : this.data.expandedDeviceId
    const searchKeyword = Object.prototype.hasOwnProperty.call(update, 'searchKeyword')
      ? update.searchKeyword
      : this.data.searchKeyword
    const statusFilter = Object.prototype.hasOwnProperty.call(update, 'statusFilter')
      ? update.statusFilter
      : this.data.statusFilter
    const groupFilter = Object.prototype.hasOwnProperty.call(update, 'groupFilter')
      ? update.groupFilter
      : this.data.groupFilter
    const sortMode = Object.prototype.hasOwnProperty.call(update, 'sortMode')
      ? update.sortMode
      : this.data.sortMode
    const devices = buildDeviceList(expandedDeviceId)

    this.setData({
      ...update,
      devices,
      filteredDevices: applyDeviceFilters(devices, searchKeyword, statusFilter, groupFilter, sortMode)
    })
  },

  onDeviceSearch(e) {
    this.refreshDevices({
      searchKeyword: e.detail.value
    })
  },

  toggleFilterPanel() {
    this.setData({
      showFilterPanel: !this.data.showFilterPanel,
      showSortPanel: false
    })
  },

  toggleSortPanel() {
    this.setData({
      showSortPanel: !this.data.showSortPanel,
      showFilterPanel: false
    })
  },

  selectStatusFilter(e) {
    this.refreshDevices({
      statusFilter: e.currentTarget.dataset.key,
      showFilterPanel: true
    })
  },

  selectGroupFilter(e) {
    this.refreshDevices({
      groupFilter: e.currentTarget.dataset.key,
      showFilterPanel: true
    })
  },

  selectSortMode(e) {
    this.refreshDevices({
      sortMode: e.currentTarget.dataset.key,
      showSortPanel: false
    })
  },

  action(e) {
    wx.showToast({ title: e.currentTarget.dataset.text, icon: 'none' })
  },

  openBluetoothSheet() {
    this.setData({
      showBluetoothSheet: true,
      bluetoothStep: 1,
      bluetoothScanning: false,
      bluetoothDevices: this.data.bluetoothDevices,
      selectedBluetoothDevice: null
    })
  },

  closeBluetoothSheet() {
    this.bluetoothScanToken = null
    this.setData({
      showBluetoothSheet: false,
      bluetoothScanning: false
    })
  },

  startBluetoothScan() {
    const scanToken = Date.now()
    this.bluetoothScanToken = scanToken
    this.setData({
      bluetoothStep: 2,
      bluetoothScanning: true,
      bluetoothDevices: [],
      selectedBluetoothDevice: null
    })
    deviceData.scanBluetoothDevices().then(devices => {
      if (this.bluetoothScanToken !== scanToken || !this.data.showBluetoothSheet) return
      this.setData({
        bluetoothScanning: false,
        bluetoothDevices: devices
      })
    }).catch(() => {
      if (this.bluetoothScanToken !== scanToken) return
      this.setData({ bluetoothScanning: false })
      wx.showToast({ title: '扫描失败，请稍后重试', icon: 'none' })
    })
  },

  selectBluetoothDevice(e) {
    const id = e.currentTarget.dataset.id
    const selected = this.data.bluetoothDevices.find(item => item.id === id)
    if (!selected) return
    this.setData({
      bluetoothStep: 3,
      selectedBluetoothDevice: selected
    })
  },

  bindBluetoothDevice() {
    if (!this.data.selectedBluetoothDevice) {
      wx.showToast({ title: '请先选择蓝牙路锥', icon: 'none' })
      return
    }
    this.setData({ bluetoothStep: 4 })
    deviceData.bindBluetoothDevice(this.data.selectedBluetoothDevice).then(result => {
      wx.showToast({ title: result.message || '蓝牙设备已绑定', icon: 'success' })
      this.refreshDevices()
    }).catch(() => {
      wx.showToast({ title: '绑定失败，请稍后重试', icon: 'none' })
    })
  },

  runNearbyDiagnosis() {
    if (this.data.diagnosisRunning) return
    this.setData({ diagnosisRunning: true })
    deviceData.runNearbyDiagnosis().then(report => {
      const summary = `诊断完成：附近 ${report.nearbyCount} 台设备，${report.healthText}`
      this.setData({
        diagnosisRunning: false,
        diagnosisSummary: summary,
        diagnosisItems: diagnosisItems(report)
      })
      wx.showToast({ title: summary, icon: 'none' })
    }).catch(() => {
      this.setData({ diagnosisRunning: false })
      wx.showToast({ title: '诊断失败，请稍后重试', icon: 'none' })
    })
  },

  toggleDevice(e) {
    const id = e.currentTarget.dataset.id
    this.refreshDevices({
      expandedDeviceId: this.data.expandedDeviceId === id ? '' : id
    })
  },

  noop() {},

  deviceAction(e) {
    const type = e.currentTarget.dataset.type
    const id = e.currentTarget.dataset.id
    if (type === 'control') {
      getApp().globalData.selectedDeviceId = id
      wx.redirectTo({ url: '/pages/control/control?device=' + id })
      return
    }
    wx.showToast({ title: e.currentTarget.dataset.text, icon: 'none' })
  }
})
