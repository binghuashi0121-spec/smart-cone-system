const mock = require('../../utils/mock.js')

const warningModeLabels = {
  normal: '常规施工',
  night: '夜间增强',
  fog: '雨雾警示',
  emergency: '事故应急',
  silent: '静音警示'
}

function coneIconPath(item, mapTone) {
  if (item.status === 'offline') {
    return '/assets/icons/pages/index/traffic-cone-offline.svg'
  }
  if (mapTone === 'low') {
    return '/assets/icons/pages/index/traffic-cone-low.svg'
  }
  if (mapTone === 'shifted') {
    return '/assets/icons/pages/index/traffic-cone-shifted.svg'
  }
  if (mapTone === 'tilted') {
    return '/assets/icons/pages/index/traffic-cone-tilted.svg'
  }
  return '/assets/icons/pages/index/traffic-cone-normal.svg'
}

function coneStatusMeta(item) {
  const isLowBatteryCritical = item.status === 'lowBattery' && item.online && item.battery > 0 && item.battery < 20
  const isShifted = item.id === 'C07'
  const isTilted = item.status === 'tilted'

  if (isTilted) {
    return {
      isLowBatteryCritical: false,
      mapTone: 'tilted',
      statusTone: 'danger',
      statusLabel: '倾倒异常'
    }
  }

  if (isShifted) {
    return {
      isLowBatteryCritical,
      mapTone: 'shifted',
      statusTone: 'shifted',
      statusLabel: '位置偏移'
    }
  }

  if (isLowBatteryCritical) {
    return {
      isLowBatteryCritical,
      mapTone: 'low',
      statusTone: 'warning',
      statusLabel: '低电量'
    }
  }

  if (item.status === 'offline') {
    return {
      isLowBatteryCritical: false,
      mapTone: 'offline',
      statusTone: 'offline',
      statusLabel: '离线'
    }
  }

  return {
    isLowBatteryCritical,
    mapTone: 'normal',
    statusTone: 'normal',
    statusLabel: '正常'
  }
}

function previewConeList(items) {
  const priorityIds = ['C16', 'C07', 'C18']
  const priorityItems = priorityIds
    .map(id => items.find(item => item.id === id))
    .filter(Boolean)
  const otherItems = items.filter(item => !priorityIds.includes(item.id))
  return [...otherItems.slice(0, 14), ...priorityItems]
}

function alertSheetMeta(alert, tone = 'danger') {
  const isWarning = tone === 'warning'
  const isShifted = tone === 'shifted'
  return {
    ...alert,
    alertTone: isWarning ? 'warning' : isShifted ? 'shifted' : 'danger',
    sheetTitle: isWarning ? '低电量处理' : isShifted ? '位置偏移处理' : '告警处理',
    levelLabel: isWarning ? '电量等级' : isShifted ? '偏移等级' : '告警等级',
    primaryAction: isWarning ? '标记已换电' : isShifted ? '标记已校正' : '标记已处理',
    dangerAction: isWarning ? '通知维护人员' : isShifted ? '打开定位校正' : '周边加强警示'
  }
}

const cones = mock.cones.map(item => {
  const meta = coneStatusMeta(item)
  return {
    ...item,
    ...meta,
    iconPath: coneIconPath(item, meta.mapTone)
  }
})

const derivedStats = {
  ...mock.stats,
  lowBattery: cones.filter(item => item.isLowBatteryCritical).length,
  tilted: cones.filter(item => item.mapTone === 'tilted').length,
  shifted: cones.filter(item => item.mapTone === 'shifted').length
}

function readWarningMode() {
  const app = getApp()
  const appMode = app.globalData.warningMode
  const storageMode = wx.getStorageSync('warningMode')
  const mode = warningModeLabels[appMode] ? appMode : warningModeLabels[storageMode] ? storageMode : 'night'
  app.globalData.warningMode = mode
  return mode
}

Page({
  data: {
    currentPage: 'index',
    navItems: mock.navItems,
    task: mock.task,
    activeWarningMode: 'night',
    cones,
    detailCones: cones.filter(item => item.online),
    previewCones: previewConeList(cones),
    stats: derivedStats,
    alerts: mock.alerts,
    showMapDetail: false,
    showAlert: false,
    showDeviceDetail: false,
    selectedLayer: 'all',
    activeAlert: alertSheetMeta(mock.alerts[0]),
    activeDevice: cones[6],
    highlightDeviceId: ''
  },

  onLoad() {
    this.applyWarningMode()
  },

  onShow() {
    this.applyWarningMode()
  },

  applyWarningMode() {
    const mode = readWarningMode()
    this.setData({
      activeWarningMode: mode,
      task: {
        ...this.data.task,
        mode: warningModeLabels[mode]
      }
    })
  },

  switchTab(e) {
    const url = e.currentTarget.dataset.url
    if (url && url !== '/pages/index/index') {
      wx.redirectTo({ url })
    }
  },

  showToast(title) {
    wx.showToast({ title, icon: 'none' })
  },

  openMapDetail() {
    this.setData({ showMapDetail: true })
  },

  closeMapDetail() {
    this.setData({ showMapDetail: false, highlightDeviceId: '' })
  },

  selectLayer(e) {
    this.setData({ selectedLayer: e.currentTarget.dataset.layer })
  },

  openAlert(e) {
    const id = e.currentTarget.dataset.id || 'C07'
    const tone = e.currentTarget.dataset.alertTone || 'danger'
    const alert = mock.alerts.find(item => item.id === id) || mock.alerts[0]
    this.setData({
      showAlert: true,
      activeAlert: alertSheetMeta(alert, tone),
      highlightDeviceId: alert.id
    })
  },

  closeAlert() {
    this.setData({ showAlert: false })
  },

  showAlertOnMap() {
    this.setData({
      showAlert: false,
      showMapDetail: true,
      highlightDeviceId: this.data.activeAlert.id,
      selectedLayer: 'alert'
    })
  },

  handleAlertAction(e) {
    this.showToast(e.currentTarget.dataset.text)
  },

  openDeviceDetail(e) {
    const id = e.currentTarget.dataset.id
    const device = cones.find(item => item.id === id) || cones[0]
    this.setData({
      showDeviceDetail: true,
      activeDevice: device,
      highlightDeviceId: device.id
    })
  },

  closeDeviceDetail() {
    this.setData({ showDeviceDetail: false })
  },

  goControl() {
    getApp().globalData.selectedDeviceId = this.data.activeDevice.id
    wx.redirectTo({ url: '/pages/control/control?device=' + this.data.activeDevice.id })
  },

  goConnectDevice() {
    wx.navigateTo({ url: '/pages/connect/connect' })
  },

  quickAction(e) {
    const text = e.currentTarget.dataset.text
    if (text === '结束任务') {
      wx.showModal({
        title: '结束任务',
        content: '确认停止本次临时封道任务？',
        confirmColor: '#ff7a00'
      })
      return
    }
    this.showToast(text + '已执行')
  },

  refreshLocation() {
    this.showToast('定位已刷新')
  },

  startEmergency() {
    wx.showModal({
      title: '启动应急模式',
      content: '将立即启动全线警示与防护，是否继续？',
      confirmColor: '#ff3b30',
      success: res => {
        if (res.confirm) {
          getApp().globalData.warningMode = 'emergency'
          wx.setStorageSync('warningMode', 'emergency')
          this.applyWarningMode()
          this.showToast('应急模式已启动')
        }
      }
    })
  }
})
