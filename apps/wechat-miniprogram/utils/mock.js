const task = {
  title: 'G50高速临时封道',
  road: 'G50沪渝高速',
  section: 'K120+300 ~ K121+800',
  mode: '夜间增强',
  online: 18,
  total: 20,
  alerts: 2,
  time: '5月20日 22:35',
  directionLeft: '上海方向',
  directionRight: '重庆方向'
}

const cones = [
  { id: 'C01', group: 'A组', area: '主干道', battery: 96, online: true, status: 'normal', posture: '正常', signal: 5, x: 8, y: 46 },
  { id: 'C02', group: 'A组', area: '主干道', battery: 91, online: true, status: 'normal', posture: '正常', signal: 5, x: 16, y: 48 },
  { id: 'C03', group: 'A组', area: '缓冲区', battery: 78, online: true, status: 'normal', posture: '正常', signal: 4, x: 24, y: 38 },
  { id: 'C04', group: 'A组', area: '缓冲区', battery: 84, online: true, status: 'normal', posture: '正常', signal: 5, x: 31, y: 34 },
  { id: 'C05', group: 'A组', area: '缓冲区', battery: 88, online: true, status: 'normal', posture: '正常', signal: 5, x: 40, y: 37 },
  { id: 'C06', group: 'A组', area: '施工区', battery: 73, online: true, status: 'normal', posture: '正常', signal: 4, x: 50, y: 41 },
  { id: 'C07', group: 'A组', area: '施工区入口', battery: 82, online: true, status: 'alert', posture: '位置偏移', signal: 4, x: 24, y: 52 },
  { id: 'C08', group: 'A组', area: '施工区', battery: 76, online: true, status: 'normal', posture: '正常', signal: 5, x: 66, y: 48 },
  { id: 'C09', group: 'A组', area: '施工区', battery: 72, online: true, status: 'normal', posture: '正常', signal: 4, x: 74, y: 51 },
  { id: 'C10', group: 'A组', area: '施工区', battery: 69, online: true, status: 'normal', posture: '正常', signal: 4, x: 83, y: 54 },
  { id: 'C11', group: 'B组', area: '施工区', battery: 62, online: true, status: 'normal', posture: '正常', signal: 4, x: 32, y: 65 },
  { id: 'C12', group: 'B组', area: '西道口', battery: 65, online: true, status: 'alert', posture: '位置偏移', signal: 4, x: 63, y: 70 },
  { id: 'C13', group: 'B组', area: '西道口', battery: 0, online: false, status: 'offline', posture: '离线', signal: 1, x: 81, y: 69 },
  { id: 'C14', group: 'B组', area: '西道口', battery: 0, online: false, status: 'offline', posture: '离线', signal: 1, x: 90, y: 73 },
  { id: 'C15', group: 'B组', area: '西道口', battery: 0, online: false, status: 'offline', posture: '离线', signal: 1, x: 97, y: 77 },
  { id: 'C16', group: 'B组', area: '缓冲区', battery: 16, online: true, status: 'lowBattery', posture: '正常', signal: 3, x: 45, y: 66 },
  { id: 'C17', group: 'B组', area: '缓冲区', battery: 29, online: true, status: 'normal', posture: '正常', signal: 3, x: 53, y: 69 },
  { id: 'C18', group: 'B组', area: '西道口', battery: 68, online: true, status: 'tilted', posture: '倾倒异常', signal: 3, x: 21, y: 58 },
  { id: 'C19', group: 'C组', area: '施工区', battery: 47, online: true, status: 'normal', posture: '正常', signal: 4, x: 58, y: 50 },
  { id: 'C23', group: 'C组', area: '施工区', battery: 58, online: true, status: 'normal', posture: '正常', signal: 5, x: 72, y: 49 }
]

const stats = {
  online: 18,
  total: 20,
  lowBattery: 1,
  tilted: 1,
  shifted: 1
}

const alerts = [
  {
    id: 'C07',
    level: '紧急',
    type: '位置偏移',
    location: '施工区入口 120m',
    time: '14:32',
    advice: '请前往校正位置并确认导流阵列完整。'
  },
  {
    id: 'C16',
    level: '重要',
    type: '低电量',
    location: '缓冲区中段',
    time: '14:37',
    advice: '请安排维护人员更换电池，保持导流阵列持续警示。'
  },
  {
    id: 'C12',
    level: '紧急',
    type: '路锥倾倒 / 位置偏移',
    location: '施工区尾端 80m',
    time: '14:35',
    advice: '请前往扶正或更换设备。'
  },
  {
    id: 'C18',
    level: '重要',
    type: '倾倒异常',
    location: '西道口安全岛',
    time: '14:39',
    advice: '请检查路锥姿态并恢复正常摆放。'
  }
]

const navItems = [
  { page: 'index', text: '首页', iconPath: '/assets/icons/pages/index/nav-home.svg', url: '/pages/index/index' },
  { page: 'control', text: '控制', iconPath: '/assets/icons/pages/index/nav-control.svg', url: '/pages/control/control' },
  { page: 'devices', text: '设备', iconPath: '/assets/icons/pages/index/nav-device.svg', url: '/pages/devices/devices' }
]

module.exports = {
  task,
  cones,
  stats,
  alerts,
  navItems
}
