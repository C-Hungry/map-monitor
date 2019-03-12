const routers = [
  {
    path: '/',
    redirect: "/login",
  },
  // 登录
  {
    path: '/login',
    meta: {
      title: '登录'
    },
    component: (resolve) => require(['../views/login/index.vue'], resolve)
  },
  // 权限验证
  {
    path: '/authorize',
    meta: {
      title: '权限验证'
    },
    component: (resolve) => require(['../views/authorize/index.vue'], resolve)
  },
  // 地图
  {
    path: '/map',
    component: (resolve) => require(['../views/mapPC/index.vue'], resolve),
    children: [
      // 地图监控
      {
        path: '/map/truckMonitor',
        meta: {
          title: '车辆监控'
        },
        component: (resolve) => require(['../views/mapPC/truckMonitor/index.vue'], resolve)
      },
      // 轨迹回放
      {
        path: '/map/playback',
        meta: {
          title: '轨迹回放'
        },
        component: (resolve) => require(['../views/mapPC/playback/index.vue'], resolve)
      },
      // 任务监控
      {
        path: '/map/taskMonitor',
        meta: {
          title: '任务监控'
        },
        component: (resolve) => require(['../views/mapPC/taskMonitor/index.vue'], resolve)
      },
      // 区域管理
      {
        path: '/map/areaManage',
        meta: {
          title: '区域管理'
        },
        component: (resolve) => require(['../views/mapPC/areaManage/index.vue'], resolve)
      },
      // 编辑或者新增区域
      {
        path: '/map/areaEdit',
        meta: {
          title: '区域编辑'
        },
        component: (resolve) => require(['../views/mapPC/areaEdit/index.vue'], resolve)
      },
      // 线路管理
      {
        path: '/map/routeManage',
        meta: {
          title: '线路管理'
        },
        component: (resolve) => require(['../views/mapPC/routeManage/index.vue'], resolve)
      }
    ]
  },
  // H5地图
  {
    path: '/mapH5',
    component: (resolve) => require(['../views/mapH5/index.vue'], resolve),
    children: [
      // H5地图监控
      {
        path: '/mapH5/truckMonitor',
        meta: {
          title: '车辆监控'
        },
        component: (resolve) => require(['../views/mapH5/truckMonitor/index.vue'], resolve)
      },
      // H5任务监控
      {
        path: '/mapH5/taskMonitorH5',
        meta: {
          title: '任务监控'
        },
        component: (resolve) => require(['../views/mapH5/taskMonitor/index.vue'], resolve)
      },
      // H5轨迹回放
      {
        path: '/mapH5/playback',
        meta: {
          title: '轨迹回放'
        },
        component: (resolve) => require(['../views/mapH5/playback/index.vue'], resolve)
      },
      // H5位置信息管理
      {
        path: '/mapH5/addressManage',
        meta: {
          title: '地址管理'
        },
        component: (resolve) => require(['../views/mapH5/address/index.vue'], resolve)
      },
      // H5地址选择
      {
        path: '/mapH5/addressManageMap',
        meta: {
          title: '地址选择'
        },
        component: (resolve) => require(['../views/mapH5/address/addressManageMap.vue'], resolve)
      },
    ]
  }
];
export default routers;