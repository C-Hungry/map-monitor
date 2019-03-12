import zkBMapMonitor from '../../../components/zkBMapMonitor.vue';
import zkGMapMonitor from '../../../components/zkGMapMonitor.vue';
import {setInterval, clearInterval} from 'timers';
let mapMonitorInterval = null;
export default {
  components: {
    zkBMapMonitor,
    zkGMapMonitor
  },
  data() {
    return {
      loading: true,
      mapUseType: "bmap", // 百度bmap 或者 谷歌gmap
      mapType: 'NORMAL_MAP', // 平面图NORMAL_MAP 或者 卫星图SATELLITE_MAP
      searchType: 1,
      position: "",
      center: null,
      zoom: 13,

      websocket: null,
      isFirst: true, // 是否是websocket第一次数据
      allCarNumberList: [], // 所有包含gps信息的车辆
      simId: "", // 当前选中的车辆的simId
      allPoints: [], // 所有坐标点集合
      allOldSimIds: [], // 上次获取到的所有车辆的simIds,与新拿到的simIds作比较
      allCurrentSimIds: "", // 最新所有车辆simids集合
      // isNeedCloseWS: false, // 上次获取到的所有车辆的simIds,与新拿到的simIds作比较,判断是否需要关闭ws
      statistic: { // 统计信息
        total: 0, 
        running: 0,
        parking: 0,
        offline: 0,
        lost: 0
      },

      tagStatus: "all", // 底部表格当前选中状态  tag样式激活使用
      refreshTime: 0,
      tableLoading: false,
      isShowTable: false,
      currentPage: 1, 
      pageSize: 5,
      totalCount: 0,
      allTableData: [],
      currentTableData: [], // 缓存当前状态的点集合
      tableData: [],
      columns: [
        {
          title: "车牌号",
          key: "CarNum",
          fixed: "left",
          width: 95
        },
        {
          title: "发货单位",
          key: "consignerInfo",
          minWidth: 140
        },
        {
          title: "收货单位",
          key: "receiverInfo",
          minWidth: 140
        },
        {
          title: "派车时间",
          key: "dispatchTime",
          minWidth: 140
        },
        {
          title: "货物",
          key: "productInfo",
          minWidth: 60
        },
        {
          title: "定位时间",
          key: "GpsTime",
          minWidth: 140
        },
        {
          title: "车辆状态",
          key: "gpsStatus",
          minWidth: 70
        },
        {
          title: "速度(km/h)",
          key: "SpeedKmH",
          minWidth: 100
        },
        {
          title: "当前位置",
          key: "location",
          minWidth: 160
        }
      ]
    }
  },
  methods: {
    // 分页
    onPageChanged(page){
      this.currentPage = page;
      this.getCarListByStatus();
    },
    // 分页
    onPageSizeChanged(size) {
      this.currentPage = 1;
      this.pageSize = size;
      this.getCarListByStatus();
    },
    // 点击表格行
    onRowClick(row) {
      this.simId = row.SimId;
      this.onSelectChange(row.SimId);
    },
    // 工具栏车辆筛选
    onTruckSelectChange(value) {
      this.simId = value;
      this.onSelectChange(value);
    },
    // 搜索栏位置
    onSearchPosition() {
      this.$refs['zkMapMonitor'].drawPosition(this.position);
    },
    // 检测simId变化，在地图上弹出该坐标点的infowindow
    onSelectChange(simId) {
      if (!simId) {
        // this.$Message.error('该车辆未绑定GPS设备，或者车辆信息录入错误。');
      } else {
        this.$refs['zkMapMonitor'].onInfoWindowClose();
        let isExit = false;
        for(let i=0;i<this.allPoints.length;i++) {
          if(this.allPoints[i].SimId == simId) {
            isExit = true;
            this.$refs['zkMapMonitor'].openInfoWindow(this.allPoints[i], i);
            break;
          } 
        }
        !isExit && this.$Message.warning('该车辆暂无定位信息！');
      }
    },
    // 显示table
    showTable() {
      this.isShowTable = !this.isShowTable;
      this.isShowTable && this.getSimIdListByStatus(this.tagStatus);
    },
    // 前端分页（底部表格）
    getCarListByStatus() {
      this.tableData = this.currentTableData.slice(this.pageSize * (this.currentPage -1) , this.pageSize * this.currentPage);
      this.totalCount = this.currentTableData.length;
    },   
    // 平面图与卫星图切换
    changeMapType() {
      this.mapType = this.mapType == 'NORMAL_MAP' ? 'SATELLITE_MAP' : 'NORMAL_MAP';
    },
    // 初始化WebSocket
    initWebSocket() {
      /*
      * isFirst 是否初始化加载，
      * isNeedCloseWS 是否需要关闭websocket
      * 地图早初始化加载时需要调接口查询车辆信息及车辆位置信息
      * 在进行地图切换时则不需要调接口查询相关，且需要保留缓存位置信息、中心点、缩放比例
      */
      if (!this.isFirst) {
        this.$refs['zkMapMonitor'].initMap(this.allPoints, this.center, this.zoom);
        return;
      }

      // 判断当前浏览器是否支持WebSocket
      if ('WebSocket' in window) {
        let url = this.$config.get('websocketUrl');
        this.websocket = new WebSocket(url);
      } else {
        this.$Message.error('您的浏览器暂不支持WebSocket协议。');
        return;
      }

      // 连接发生错误的回调方法
      this.websocket.onerror = (error) => {
        this.loading = false;
        this.$Message.error('WebSocket连接发生异常。');
      };

      // 连接成功建立的回调方法
      this.websocket.onopen = (event) => {
        if (!this.isFirst) {
          this.startWebSocket(this.allCurrentSimIds);
        } else {
          this.getAllCarList();
        }
      };

      // 连接关闭的回调方法
      this.websocket.onclose = (event) => {
        if (!this.isFirst) {
          this.isFirst = true;
          this.initWebSocket();
        }
      };

      // 接收到消息的回调方法
      this.websocket.onmessage = (res) => {
        this.loading = false;
        let data = JSON.parse(res.data);
        this.initMapData(data);
      };

    },
    // 启动WebSocket
    startWebSocket(wsParams) {
      if (wsParams) {
        this.websocket && this.websocket.send(wsParams);
      } 
      else {
        this.loading = false;
        this.$Message.warning('暂无车辆。');
      }
    },
    // 初始化地图数据
    initMapData(data) {
      // 状态信息统计
      if (this.isFirst) {
        this.isFirst = false;
        this.allPoints=[];
        for (let key in data) {
          let p = data[key];

          // google坐标
          let g_point = this.$utils.wgs84togcj02(p.Longitude, p.Latitude);
          p.g_lng = g_point[0];
          p.g_lat = g_point[1];

          // 百度坐标
          let b_point = this.$utils.gcj02tobd09(...g_point);
          p.lng = b_point[0];
          p.lat = b_point[1];

          // 统计状态
          if (!p.IsLocated) {
            p.gpsStatus = "未定位";
          }
          if (p.IsLocated && p.IsOffline) {
            p.gpsStatus = "离线";
          }
          if (p.IsLocated && !p.IsOffline && p.SpeedKmH == 0) {
            p.gpsStatus = "停车";
          }
          if (p.IsLocated && !p.IsOffline && p.SpeedKmH > 0) {
            p.gpsStatus = "运行中";
          }

          p.location = "";

          this.allPoints.push(p);
        }
      }
      else {
        let [...allPoints] = this.allPoints;
        for (let key in data) {
          let isExit = false;
          let p = data[key];

          // google坐标
          let g_point = this.$utils.wgs84togcj02(p.Longitude, p.Latitude);
          p.g_lng = g_point[0];
          p.g_lat = g_point[1];

          // 百度坐标
          let b_point = this.$utils.gcj02tobd09(...g_point);
          p.lng = b_point[0];
          p.lat = b_point[1];

          // 统计状态
          if (!p.IsLocated) {
            p.gpsStatus = "未定位";
          }
          if (p.IsLocated && p.IsOffline) {
            p.gpsStatus = "离线";
          }
          if (p.IsLocated && !p.IsOffline && p.SpeedKmH == 0) {
            p.gpsStatus = "停车";
          }
          if (p.IsLocated && !p.IsOffline && p.SpeedKmH > 0) {
            p.gpsStatus = "运行中";
          }

          p.location = "";
          p.consignerInfo = "";
          p.receiverInfo = "";
          p.productInfo = "";
          p.dispatchTime = "";

          for (let i = 0; i < allPoints.length; i++) {
            if (key == allPoints[i].SimId) {
              this.$set(this.allPoints, i, p)
              isExit = true;
              break;
            } else {
              isExit = false;
            }
          }
          !isExit && this.allPoints.push(p);
        }
      }
      // 地址逆解析
      try {
        let promiseArrey = this.reverseAddress(this.allPoints);
        Promise.all(promiseArrey)
          .then(results => {
            this.allPoints.map((item, index) => {
              item.location = results[index].address;
              for(let i=0;i<this.allTableData.length;i++) {
                if (this.allTableData[i].SimId == item.SimId) {

                  item.consignerInfo = this.allTableData[i].consignerInfo;
                  item.receiverInfo = this.allTableData[i].receiverInfo;
                  item.productInfo = this.allTableData[i].productInfo;
                  item.dispatchTime = this.allTableData[i].dispatchTime;

                  this.$set(this.allTableData, i, {
                    'CarNum': item.CarNum,
                    'GpsTime': item.GpsTime,
                    'gpsStatus': item.gpsStatus,
                    'SpeedKmH': item.SpeedKmH,
                    'location': item.location,
                    'SimId': item.SimId,
                    'IsOffline': item.IsOffline,
                    'consignerInfo': this.allTableData[i].consignerInfo,
                    'receiverInfo': this.allTableData[i].receiverInfo,
                    'productInfo': this.allTableData[i].productInfo,
                    'dispatchTime': this.allTableData[i].dispatchTime
                  })
                  break;
                }
              }
              return item;
            })
            if (!this.isFirst) {
              this.$refs['zkMapMonitor'].initMap(this.allPoints, null, null, true);
            } else {
              this.$refs['zkMapMonitor'].initMap(this.allPoints);
            }
            this.statisticByStatus();
          })
          .catch( err => {
            if (!this.isFirst) {
              this.$refs['zkMapMonitor'].initMap(this.allPoints, null, null, true);
            } else {
              this.$refs['zkMapMonitor'].initMap(this.allPoints);
            }
            this.statisticByStatus();
          })
      } catch (error) {
        if (!this.isFirst) {
          this.$refs['zkMapMonitor'].initMap(this.allPoints, null, null, true);
        } else {
          this.$refs['zkMapMonitor'].initMap(this.allPoints);
        }
        this.statisticByStatus();
      }
      
    },
    // 位置逆解析，同意采用百度的地址解析，因为google地址解析返回多数为null
    reverseAddress(points) {
      // 地址逆解析
      var promiseArrey = [];
      var geocoder = new BMap.Geocoder();    
      points.forEach(item => {
        var promise = new Promise((resolve, reject) => {
          try {
            geocoder.getLocation(new BMap.Point(item.lng, item.lat), function(result){      
              if (result){
                resolve({ address: result.address })
              } else { 
                resolve({ address: "" });
              }      
            });
          } catch (error) {
            resolve({ address: "" });
          }
        })
        promiseArrey.push(promise)
      })
      
      return promiseArrey
    },
    // 保留center和zoom
    saveCenterAndZoom(center,zoom) {
      this.center = center;
      this.zoom = zoom;
    },
    // 状态统计
    statisticByStatus() {
      this.statistic = {
        total: this.allCarNumberList.length,
        running: 0,
        parking: 0,
        offline: 0,
        lost: 0
      }
      this.allPoints.forEach(item=>{
        // 统计状态
        if (!item.IsLocated) {
          this.statistic.lost++;
        }
        if (item.IsLocated && item.IsOffline) {
          this.statistic.offline++;
        }
        if (item.IsLocated && !item.IsOffline && item.SpeedKmH == 0) {
          this.statistic.parking++;
        }
        if (item.IsLocated && !item.IsOffline && item.SpeedKmH > 0) {
          this.statistic.running++;
        }
      })
      this.isShowTable && this.getSimIdListByStatus(this.tagStatus);
    },
    // 获取车辆及simId
    getAllCarList() {

      this.$commonService
      .get("/monitor/getTruckInfoByMonitor", {})
      .then(res => {
        if(!res.success){
          this.loading = false;
          this.$Message.error(res.msg);
          return;
        }

        // 获取当前simId并去重
        this.allCarNumberList = [];
        this.allTableData = [];
        let allCurrentSimIds = [];
        res.data.forEach(item => {
          if (item.gpsId && allCurrentSimIds.indexOf(item.gpsId) == -1) {
            allCurrentSimIds.push(item.gpsId);
            this.allCarNumberList.push(item);
            this.allTableData.push({
              'CarNum': item.truckNo,
              'SimId': item.gpsId,
              'GpsTime': "",
              'gpsStatus': "未定位",
              'SpeedKmH': "",
              'location': "",
              'IsOffline': false,
              'consignerInfo': item.consignerInfo,
              'receiverInfo': item.receiverInfo,
              'productInfo': item.productInfo,
              'dispatchTime': item.dispatchTime
            })
          }
        })

        this.allCurrentSimIds = allCurrentSimIds.join(',');
        this.allOldSimIds = allCurrentSimIds;
        
        /**
         * 判断是否要重新开启websocket
         * 重新获取simId后需要重新启动websocket(只有关闭后才能拿到全部simId的坐标)
         */
        if (this.isFirst) {
          this.startWebSocket(this.allCurrentSimIds);
          this.getAllCarListInterval();
        } else {
          this.websocket.close();
        }

      })
      .catch(err => {
        this.loading = false;
        err.msg && this.$Message.error(err.msg);
        this.getAllCarListInterval();
      });
    },
    // 定时刷新当前车辆列表
    getAllCarListInterval() {
      this.refreshTime = 300;
      mapMonitorInterval && clearInterval(mapMonitorInterval);
      mapMonitorInterval = setInterval(()=>{
        if (this.refreshTime == 0) {
          clearInterval(mapMonitorInterval)
          this.getAllCarList();
        } else {
          this.refreshTime--;
        }
      }, 1000)
    },
    // 根据状态获取sim卡列表  前端分页使用
    getSimIdListByStatus(status) {
      this.tagStatus = status;
      this.isShowTable = true;
      this.currentTableData = [];
      this.currentPage = 1;
      // 获取车辆信息
      this.allTableData.forEach(item=>{
        if (status == 'all') {
          this.currentTableData.push(item);
        } else if (status == 'running' && item.gpsStatus == '运行中') {
          this.currentTableData.push(item);
        } else if (status == "offline" && item.gpsStatus == '离线') {
          this.currentTableData.push(item);
        } else if (status == "parking" && item.gpsStatus == '停车') {
          this.currentTableData.push(item);
        } else if (status == "lost" && item.gpsStatus == '未定位') {
          this.currentTableData.push(item);
        }
      })
      this.getCarListByStatus();
    }
  },
  mounted() {
    this.center = this.$storage.getCorpCenter();
  },
  beforeDestroy() {
    this.isFirst = true;
    this.websocket && this.websocket.close();
    mapMonitorInterval && clearInterval(mapMonitorInterval);
  }
}