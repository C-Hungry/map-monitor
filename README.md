## TMS运输监控平台

```
系统主要解决的问题

1、TMS运输监控平台车辆监控；

```
### 安装及运行


```

安装依赖包推荐使用cnpm  

npm install -g cnpm --registry=https://registry.npm.taobao.org

切换cnpm地址为私有仓储

cnpm config set registry http://192.168.3.253:4873/

配置后

cnpm install   // 安装依赖包

npm run init  // 项目第一次启动需创建 index.html 

npm run dev   // 运行

npm run build  // 打包

在iis上启动生产环境：
下载安装：https://www.iis.net/downloads/microsoft/url-rewrite
创建网站目录指向当前文件夹

```

### 目录结构


```

请参照标准及时更新...


├── dist                        // 编译后的压缩包
├── src                      
│   ├── components              // 公共组件
│   │   │
│   │   ├── zkBMapMonitor          // 我的车辆及任务监控
│   │   ├── zkGMapMonitor          // 我的车辆及任务监控
│   │   ├── zkBMapPlayback         // 轨迹回放
│   │   ├── zkGMapPlayback         // 轨迹回放
│   │   ├── zkBMapMonitorH5        // 我的车辆及任务监控H5
│   │   ├── zkBMapPlaybackH5       // 我的车辆及任务监控H5
│   │   │ 
│   │   └── ...
│   │ 
│   ├── config                  // 公共配置
│   │   │ 
│   │   └──config-plugin.js     // 资源服务URL地址配置
│   │ 
│   ├── directive               // 公共指令
│   ├── assets                  // 图片
│   ├── libs   
│   │   │
│   │   ├── service.plugin     // AJAX
│   │   ├── storage.plugin     // 本地存储
│   │   ├── utils.plugin       // 常用工具函数
│   │   │ 
│   │   └── ...
│   │ 
│   ├── router                  // 路由
│   ├── store                   // vux状态管理
│   ├── styles                  // 公共css
│   ├── template                // index.html编译模板
│   ├── views                   
│   │   │
│   │   ├── authorize          // 权限验证
│   │   ├── homepage           // 本地测试
│   │   │
│   │   ├── mapPC                // PC地图
│   │   │   │
│   │   │   ├── playback          // 轨迹回放
│   │   │   ├── taskMonitor       // 任务监控
│   │   │   └── truckMonitor      // 我的车辆
│   │   │
│   │   ├── mapH5              // 移动端地图
│   │   │   │
│   │   │   ├── playback          // 轨迹回放
│   │   │   ├── taskMonitor       // 任务监控
│   │   │   └── truckMonitor      // 我的车辆
│   │   └── ...
│   │ 
│   ├── app.vue                 // 路由入口
│   ├── main.js                 // 项目入口
│   └── vendors.js              // 第三方库引入
│   
├── .babelrc                    // babel配置
├── .gitignore                  // git配置文件
├── index.html                  // 项目启动入口 
├── package-lock.json           // 依赖包当前版本
├── package.json                // npm配置
├── README.md                   // 项目描述
├── webpack.base.config.js      // webpack基础配置
├── webpack.dev.config.js       // webpack开发环境配置
└── webpack.prod.config.js      // webpack生产环境配置

```
#### 1.开发时权限验证
```
开发地图监控模块时，可通过登录界面模拟测试。权限验证界面接收参数调用运输监控平台接口，获取assess_token：
```
##### 登录界面信息说明：
| 登录信息  | 说明         | 是否必填  |类型 |长度
| :-------- | :------------- | :---- |:-----|:-----
| appkey   |账号，即公钥，由TMS进行分配至各个项目| 是 |string
| appsecret   |密码，即私钥。appsecret由TMS分配至各个项目。 | 是 |string|32
| type   | 类型，即跳转的地图类型，支持类型见下表 | 是 |string

#### 2.项目嵌入时权限验证
```
各项目接入运输监控平台地图时通过iframe方式嵌入，iframe对应的src需要传递四个参数。权限验证界面接收参数调用运输监控平台接口，获取assess_token：
```
##### 参数说明：
| 参数名称  | 说明         | 是否必填  |类型 |长度
| :-------- | :------------- | :---- |:-----|:-----
| appkey    |公钥，由TMS进行分配至各个项目| 是 |string
| signature   |加密后的签名验证，MD5(appkey-appsecret-time)。appsecret由TMS分配至各个项目。 | 是 |string|32
| time   |当前时间timespan | 是 |string
| type   |跳转的地图类型，支持类型见下表 | 是 |string

##### 目前type支持的类型：
| 类型值  | 说明         |类型 | 客户端
| :-------- | :------------- | :---- | :---- 
| truckMonitor  |我的车辆| 地图 | PC端
| taskMonitor   |任务监控| 地图 | PC端
| playback   |轨迹回放| 地图 | PC端
| truckMonitorH5  |我的车辆| 地图 | 移动端
| taskMonitorH5   |任务监控| 地图 | 移动端
| playbackH5   |轨迹回放| 地图 | 移动端