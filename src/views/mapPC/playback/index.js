import vueSlider from 'vue-slider-component';
import zkBMapPlayback from '../../../components/zkBMapPlayback.vue';
import zkGMapPlayback from '../../../components/zkGMapPlayback.vue';
let interval = null;
export default {
  components: {
    vueSlider,
    zkBMapPlayback,
    zkGMapPlayback
  },
  data() {
    return {
      loading: true,
      mapUseType: "bmap", // 百度bmap 或者 谷歌gmap
      mapType: 'NORMAL_MAP', // 平面图NORMAL_MAP 或者 卫星图SATELLITE_MAP
      center: null,
      zoom: 13,


      isShowContentleft: true, // 是否显示左侧菜单
      isPlay: false,
      gpsId: "",
      datePickerValue: [],
      startTime: "",
      endTime: "",
      speed: "", // 速度
      allPoints: [], // 所有坐标点集合
      carNumberList: [],
      startPoint: { // 起点
        show: false,
        point: null
      },
      endPoint: { // 终点
        show: false,
        point: null
      },
      currentPoint: { // 车辆位置
        show: false,
        point: null
      },
      infoWindow: { // 信息窗体
        show: false,
        point: null
      },
      iconGreen: require('../../../assets/position-green1.png'),
      iconStartPoint: require('../../../assets/marker_start_point.png'),
      iconEndPoint: require('../../../assets/marker_end_point.png'),
      slider: { // 滚动轴
        tooltip: false,
        value: 0,
        minValue: 0,
        maxValue: 0
      },
      tableData: [],
      currentPage: 1,
      pageSize: 10,
      totalCount: 0,
      rows: [],
      columns: [
        {
          title: "序号",
          key: "no",
          width: 65
        },
        {
          title: "时间",
          key: "GpsTime",
          minWidth: 150
        },
        {
          title: "速度(km/h)",
          key: "SpeedKmH",
          minWidth: 100
        }
      ]
    }
  },
  methods: {
    // 日期组件
    onDatePickerChange(date) {
      this.startTime = date[0];
      this.endTime = date[1];
    },
    // 分页
    onPageSizeChanged(size) {
      this.currentPage = 1;
      this.pageSize = size;
      this.getGpsInfoList();
    },
    // 分页
    onPageChanged(page){
      this.currentPage = page;
      this.getGpsInfoList();
    },
    getGpsInfoList() {
      this.totalCount = this.allPoints.length;
      this.tableData = this.allPoints.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
    },
    // 确定
    search() {
      if (!this.gpsId) {
        this.$Message.error('请选择车辆');
      } else if (this.gpsId == 1) {
        this.$Message.error('该车辆未绑定GPS设备，或者车辆信息录入错误。');
      } else {
        this.getHistoryRoute();
      }
    },
    // 平面图与卫星图切换
    changeMapUseType() {
      this.mapType = this.mapType == 'NORMAL_MAP' ? 'SATELLITE_MAP' : 'NORMAL_MAP';
    },
    // 获取历史轨迹
    getHistoryRoute() {
      this.loading = true;
      this.$bizService.get("/GPSService/GetHisGps",{
        terminalID: this.gpsId,
        stime: this.startTime,
        etime: this.endTime
      }).then(res => {
        this.loading = false;
        this.allPoints = [];
        res.data.forEach((item, index) => {
          // google坐标
          let g_point = this.$utils.wgs84togcj02(item.Longitude, item.Latitude);
          item.g_lng = g_point[0];
          item.g_lat = g_point[1];

          // 百度坐标
          let b_point = this.$utils.gcj02tobd09(...g_point);
          item.lng = b_point[0];
          item.lat = b_point[1];

          item.location = "";
          item.no = index + 1;

          // 统计状态
          if (item.IsOffline) {
            item.gpsStatus = "离线";
          } else if (item.SpeedKmH == 0) {
            item.gpsStatus = "停车";
          } else if (item.SpeedKmH > 0)  {
            item.gpsStatus = "运行中";
          } else {
            item.gpsStatus = "未定位";
          }

          item.SpeedKmH = item.SpeedKmH * 10;

          item.strokeColor = item.SpeedKmH < 30 ? "#2d8cf0" : item.SpeedKmH > 70 ? "#ed3f14" : "#19be6b";
          // 行程
          item.distance = item.MilesKM - res.data[0].MilesKM;
          // 时间
          item.time = ((new Date(item.GpsTime).getTime() - new Date(res.data[0].GpsTime).getTime()) / 1000 / 60).toFixed(2);
          this.allPoints.push(item);
        })

        // 地址逆解析
        this.$refs['zkMapPlayback'].initMapData(this.allPoints);
        this.getGpsInfoList();

      }).catch(err => {
        console.log(err);
        err.msg && this.$Message.error(err.msg);
        this.loading = false;
      })
    },
    // 获取车辆及gpsId
    getAllCarList() {
      this.$commonService
      .get("/truck/selectTruckByTaxNumber", {
        currentPage: 0,
        pageSize: 0
      })
      .then(res => {
        if(!res.success){
          this.$Message.error(res.msg);
          return;
        }
        this.gpsId = "";
        let allCurrentGpsIds = [];
        this.carNumberList = [];
        res.data.forEach(item => {
          if (allCurrentGpsIds.indexOf(item.gpsId) == -1) {
            allCurrentGpsIds.push(item.gpsId);
            this.carNumberList.push(item);
          }
          if (this.truckNo == item.truckNo) {
            this.gpsId = item.gpsId;
          }
        })
        if (this.gpsId) {
          this.getHistoryRoute();
        } else {
          this.loading = false;
          this.$Message.warning('暂无该车辆轨迹信息。');
        }
      })
      .catch(err => {
        console.log(err)
        err.msg && this.$Message.error(err.msg);
      });
    },
    // map Ready事件
    onMapReady() {
      this.getAllCarList();
    },
    // 绘制线路 不是用bm-polyline因为多线路导致拖动卡顿问题
    drawRoute(points) {
      points.forEach((point, index)=>{
        if (index < points.length - 1) {
          let polyline = new BMap.Polyline([
            new BMap.Point(point.lng, point.lat),
            new BMap.Point(points[index+1].lng, points[index+1].lat)
          ], {strokeColor: point.strokeColor, strokeWeight: 5, strokeOpacity: 1});   //创建折线
          this.map.addOverlay(polyline);
        }
      })
    },
    // 定时绘制当前坐标点
    drawCurrentPoint() {
      this.slider.tooltip = 'always';
      interval = setInterval(()=>{
        this.slider.value++;
      }, 200)
    },
    // 绘制起点和终点
    drawStartAndEnd(start, end) {
      this.startPoint = {
        show: true,
        point: start
      };
      this.endPoint = {
        show: true,
        point: end
      };
    },
    // 获取地图的绽放级别及中心点
    centerAndZoom(points) {
      let view = this.map.getViewport(points);
      this.map.centerAndZoom(new BMap.Point(view.center.lng, view.center.lat), view.zoom - 1);
    },
    // 打开信息窗口
    openInfoWindow(point) {
      this.infoWindow = {
        show: true,
        point: point
      }
    },
    // 监听信息窗口关闭
    onInfoWindowClose (e) {
      this.infoWindow = {
        show: false,
        point: null
      }
    },
    // 播放或暂停
    sliderSwitch() {
      this.isPlay = !this.isPlay;
      this.isPlay ? this.drawCurrentPoint() : clearInterval(interval);
    },
    // 格式化slider的tooltip
    formatterTooltip(value) {
      return value && this.allPoints.length ? this.allPoints[value-1].time + '分 / ' + this.allPoints[value-1].distance / 10 + 'km' : "";
    },
    // 快进
    forward() {
      interval && clearInterval(interval);
      this.isPlay = false;
      this.slider.tooltip = 'always';
      this.slider.maxValue = this.allPoints.length;
      if(this.slider.value == this.allPoints.length -1) {
        this.$Message.error("已经是最后一个点，无法前进！");
      } else {
        this.slider.value++;
      }
    },    
    // 后退
    backward() {
      interval && clearInterval(interval);
      this.isPlay = false;
      this.slider.tooltip = 'always';
      this.slider.maxValue = this.allPoints.length;
      if(this.slider.value == 0) {
        this.$Message.error("已经是第一个点，无法后退！");
      }
      else {
        this.slider.value--;
      }
    },
    // 保留center和zoom
    saveCenterAndZoom(center,zoom) {
      this.center = center;
      this.zoom = zoom;
    },
  },
  watch: {
    slider: {
      handler(newValue, oldValue) {
        if (!newValue.value) {
          this.currentPoint = {
            show: false,
            point: this.allPoints[newValue.value]
          }
        } else if(newValue.value == this.allPoints.length) {
          this.isPlay = false;
          this.slider.value = 0;
          this.slider.tooltip = false;
          this.currentPoint.show = false;
          this.currentPoint.point = null;
          interval && clearInterval(interval);
        } else {
          this.currentPoint = {
            show: true,
            point: this.allPoints[newValue.value]
          }
        }
      },
      deep: true
    }
  },
  created() {
    this.truckNo = this.$route.query.truckNo;

    this.startTime = this.$route.query.startTime ? 
      this.$utils.formateDate(new Date(this.$route.query.startTime), "yyyy-MM-dd HH:mm") : 
      this.$utils.formateDate(new Date(new Date().getTime() - 60 * 60 * 1000), "yyyy-MM-dd HH:mm");

    this.endTime = this.$route.query.endTime ? 
      this.$utils.formateDate(new Date(this.$route.query.endTime), "yyyy-MM-dd HH:mm") : 
      this.$utils.formateDate(new Date(), "yyyy-MM-dd HH:mm");

    this.datePickerValue = [new Date(this.startTime), new Date(this.endTime)];
  },
  beforeDestroy() {
    
  }
}