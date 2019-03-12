<style lang="less" scoped>
#baidu-map-container {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 97px;
}
.promptMessage{
  position: absolute; 
  top: 10px; 
  left: 10px;
  background: #666;
  color: white;
  padding: 5px 10px;
  border-radius: 10px;
}
.play-slider {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  user-select: none;
}
.speed-control {
  position: absolute;
  top: 43px;
  right: 10px;
  font-size: 14px;
  .info {
    display: inline-block;
    font-size: 14px;
  }
  .label {
    display: inline-block;
    color: #57a3f3;
  }
  .value {
    display: inline-block;
    height: 30px;
    width: 30px;
    line-height: 25px;
    color: #eb484c;
    border: 3px solid #eb484c;
    border-radius: 50%;
    text-align: center; 
    cursor: pointer;
  }
}
.imgStyle{
  img{
    width: 12%;
    vertical-align: middle;
  }
}
.imgStyleSmall{
  img{
    width: 5%;
    vertical-align: middle;
    margin: 0 10px;
  }
}
</style>

<template>
  <div>
    <div id="baidu-map-container"></div>
    <div class="promptMessage">
      <span>总耗时：{{totalTime}} 分</span></br>
      <span>总里程：{{totalDistance}} km</span>
    </div>
    <div class="play-slider">
      <vue-slider 
        width="auto"
        :tooltip="slider.tooltip"
        :tooltipStyle="{'backgroundColor': '#666', 'borderColor': '#666'}"
        :formatter="formatterTooltip"
        v-model="slider.value"
        :clickable="false"
        :speed="0.2"
        :min="slider.minValue"
        :max="slider.maxValue">
      </vue-slider>
      <div style="margin: 0 10px;">
        <span>{{ $route.query.startTime }}</span>
        <span style="position: absolute; right: 10px;">{{ $route.query.endTime }}</span>
      </div>
      <div style="height: 60px;line-height: 60px; text-align: center;">
        <span @click="backward" class="imgStyleSmall"><img src="../assets/backwardH5.png" alt=""></span>
        <span @click="play" class="imgStyle" v-if="!isPlay"><img src="../assets/playH5.png" alt=""></span>
        <span @click="pause" class="imgStyle" v-if="isPlay"><img src="../assets/pauseH5.png" alt=""></span>
        <span @click="forward" class="imgStyleSmall"><img src="../assets/forwardH5.png" alt=""></span>
      </div>
      <div class="speed-control" style="line-height: 50px;">
        <span style="color: #eb484c; padding: 5px; font-size: 24px;margin-top: -3px;" @click="speedDown">- </span>
        <div class="value" >&times;{{speed}} </div>
        <span style="color: #eb484c; padding: 5px; font-size: 18px;" @click="speedUp">+ </span>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import vueSlider from 'vue-slider-component';
import { setInterval, clearInterval } from 'timers';
var playbackInterval = null;
export default {
  props: {
    // 地图展示类型 NORMAL_MAP：平面型  SATELLITE_MAP：卫星图
    mapType: { 
      type: String,
      default: "NORMAL_MAP"
    },
  },
  components: {
    vueSlider
  },
  data() {
    return {
      // isInit: true, // 是否第一次加载
      center: null,
      zoom: 14,
      zIndex: 100,
      bMap: null,
      allPoints: [],
      mapStyle: {}, // 去除景点
      iconGreen: require('../assets/position-green.png'),
      iconStartPoint: require('../assets/marker_start_point.png'),
      iconEndPoint: require('../assets/marker_end_point.png'),
      lastMarker: null,


      // 播放条相关
      isPlay: false,
      speed: 5,
      slider: { 
        tooltip: "",
        value: 0,
        minValue: 0,
        maxValue: 0
      },
      totalTime: 0,
      totalDistance: 0,
    }
  },
  methods: {
    // 地图加载
    initBaiduMap(center, zoom) {
      if (window.BMap) {
        this.bMap = new BMap.Map("baidu-map-container"); // 创建Map实例
        // 去掉景点
        this.bMap.setMapStyle({features: ['road', 'water', 'land']})
        // 设置地图类型
        this.bMap.setMapType(this.bMapType);
        // 设置中心点及缩放级别
        var point = new BMap.Point(center.lng, center.lat); // 创建点坐标
        this.bMap.centerAndZoom(point, zoom);                 
        this.bMap.enableScrollWheelZoom();
        this.$emit("onMapReady");
      } else {
        setTimeout(() => {
          this.initBaiduMap(center, zoom);
        }, 1000);
      }
    },
    // 初始化地图
    // 初始化地图三种情况：
    // 1、第一次加载
    // 2、百度与谷歌切换
    // 3、simIds被初始化
    initMapData(points, center, zoom, isDefault) {
      // 设置中心点
      if (center && zoom) {
        let point = new BMap.Point(center.lng, center.lat);
        this.bMap.setCenter(point);
        this.bMap.setZoom(zoom);
      } else {
        let view = this.bMap.getViewport(points);
        let point = new BMap.Point(view.center.lng, view.center.lat);
        let zoom = view.zoom > 13 ? 13 : view.zoom;
        this.bMap.setCenter(point);
        this.bMap.setZoom(zoom);
      }

      // 清空覆盖物
      this.bMap.clearOverlays();

      this.drawStartAndEnd(points);
      this.drawHistoryRoute(points);

      this.slider.maxValue = points.length;

      this.totalTime = points.length ? points[points.length-1].time : 0;
      this.totalDistance = points.length ? (points[points.length-1].distance).toFixed(2) : 0;

      this.allPoints = points;

    },
    // 绘制历史轨迹线路
    drawHistoryRoute(points) {
      let _this = this;
      points.forEach((item, index) => {
        let startPoint = new BMap.Point(item.lng, item.lat);
        let endPoint = index + 1 == points.length ? new BMap.Point(item.lng, item.lat) : new BMap.Point(points[index+1].lng, points[index+1].lat);
        let strokeColor = item.SpeedKmH < 30 ? "#2d8cf0" : item.SpeedKmH > 70 ? "#ed3f14" : "#19be6b";
        // 绘制折线
        var polyline = new BMap.Polyline([
          startPoint,
          endPoint,
        ], {strokeColor: strokeColor, strokeWeight: 5, strokeOpacity: 1});
        this.bMap.addOverlay(polyline);
      });
    },
    // 绘制起点和终点
    drawStartAndEnd(points) {
      if (points.length) {
        // 绘制起点
        let startPoint = new BMap.Point(points[0].lng, points[0].lat);
        let startMarker = new BMap.Marker(startPoint, {
          icon: new BMap.Icon(this.iconStartPoint, new BMap.Size(32, 32))
        })
        this.bMap.addOverlay(startMarker);
        // this.addInfoWindow(points[0], startMarker);
        
        // 绘制终点
        let endPoint = new BMap.Point(points[points.length-1].lng, points[points.length-1].lat);
        let endMarker = new BMap.Marker(endPoint, {
          icon: new BMap.Icon(this.iconEndPoint, new BMap.Size(32, 32))
        })
        this.bMap.addOverlay(endMarker);
        // this.addInfoWindow(points[points.length-1], endMarker);
      }
    },
    // 添加信息弹框
    addInfoWindow(point, marker) {
      // 关闭上一个信息窗体
      this.bMap.closeInfoWindow(); 
      // 添加信息窗体
      var iwContent = `
        <div>
          <div><span style="font-weight: 600;">车牌号：</span>${point.CarNum}</div>
          <div><span style="font-weight: 600;">通讯时间：</span>${point.LatestSingnalTime}</div>
          <div><span style="font-weight: 600;">定位时间：</span>${point.GpsTime}</div>
          <div><span style="font-weight: 600;">定位地点：</span>${point.location}</div>
        </div>`;

      var infoWindow = new BMap.InfoWindow(iwContent);
      var p = new BMap.Point(point.lng, point.lat);
      marker.addEventListener("click", (event) => {
        // 关闭上一个信息窗体
        this.bMap.closeInfoWindow(); 
        // 打开新窗户
        this.bMap.openInfoWindow(infoWindow, p);
      });
    },
    // 绘制车辆坐标
    drawMarker(item) {
      // 清楚车辆坐标点
      this.bMap.removeOverlay(this.lastMarker);
      // 添加marker点
      var point = new BMap.Point(item.lng, item.lat);
      var marker = new BMap.Marker(point, {
        icon: new BMap.Icon(this.iconGreen, new BMap.Size(20,20)),
        rotation: item.Course,
      })
      marker.setTop(true);
      this.lastMarker = marker;
      this.bMap.addOverlay(marker);
    },
    // 改变播放速度
    // changeSpeed() {
    //   if (this.speed == 10) {
    //     this.speed = 1;
    //   } else {
    //     this.speed++;
    //   }
    //   this.isPlay && this.play();
    // },
    speedDown(){
      this.speed--;
      if (this.speed <= 0) {
        this.speed = 1;
      }
      this.isPlay && this.play();
    },
    speedUp(){
      this.speed++;
      if (this.speed >= 9) {
        this.speed = 9;
      }
      this.isPlay && this.play();
    },
    // 格式化slider的tooltip
    formatterTooltip(value) {
      return value && this.allPoints.length ? this.allPoints[value-1].time + '分 / ' + (this.allPoints[value-1].distance).toFixed(2) + 'km' : "";
    },
    // 播放
    play() {
      this.isPlay = true;
      this.slider.tooltip = 'always';
      playbackInterval && clearInterval(playbackInterval);
      playbackInterval = setInterval(() => {
        this.drawMarker(this.allPoints[this.slider.value]);
        this.slider.value++;
        if (this.slider.value == this.allPoints.length) {
          this.slider.value = 0;
          this.slider.tooltip = '';
          this.isPlay = false;
          this.bMap.removeOverlay(this.lastMarker);
          clearInterval(playbackInterval);
        }
      }, 1100 - this.speed * 100)
    },
    // 暂停
    pause() {
      this.isPlay = false;
      clearInterval(playbackInterval);
    },
    // 快进
    forward() {
      playbackInterval && clearInterval(playbackInterval);
      this.isPlay = false;
      this.slider.tooltip = 'always';
      if(this.slider.value == this.allPoints.length -1) {
        this.$Message.error("已经是最后一个点，无法前进！");
      } else {
        this.drawMarker(this.allPoints[this.slider.value]);
        this.slider.value++;
      }
    },    
    // 后退
    backward() {
      playbackInterval && clearInterval(playbackInterval);
      this.isPlay = false;
      this.slider.tooltip = 'always';
      if(this.slider.value == 0) {
        this.$Message.error("已经是第一个点，无法后退！");
      }
      else {
        this.drawMarker(this.allPoints[this.slider.value]);
        this.slider.value--;
      }
    }
  },
  computed: {
    bMapType() {
      return this.mapType == 'NORMAL_MAP' ? BMAP_NORMAL_MAP : BMAP_SATELLITE_MAP;
    }
  },
  watch: {
    mapType(newVal) {
      // 设置地图类型
      this.bMap.setMapType(this.bMapType);
    }
  },
  mounted() {
    this.center = this.$storage.getCorpCenter();
    this.initBaiduMap(this.center, this.zoom);
  },
  beforeDestroy() {
    let center = this.bMap.getCenter();
    let zoom = this.bMap.getZoom();
    this.$emit('onAfterCenterAndZoom', center, zoom);
  }
};
</script>