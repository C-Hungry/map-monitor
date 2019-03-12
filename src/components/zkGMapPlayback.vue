<style lang="less" scoped>
#google-map-container {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 85px;
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
  top: 25px;
  right: 20px;
  font-size: 18px;
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
    height: 45px;
    width: 45px;
    line-height: 40px;
    color: #57a3f3;
    border: 3px solid #57a3f3;
    border-radius: 50%;
    text-align: center; 
    cursor: pointer;
  }
}
</style>

<template>
  <div>
    <div id="google-map-container"></div>
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
      <div style="height: 60px;line-height: 60px;">
        &#x3000;&#x3000;<Icon @click="backward" style="vertical-align: middle;cursor: pointer;" color="#2d8cf0" type="skip-backward" :size="24"></Icon>
        <Icon @click="play" style="vertical-align: middle;margin: 0 16px;cursor: pointer;" v-if="!isPlay" color="#ff9900" type="play" :size="45"></Icon>
        <Icon @click="pause" style="vertical-align: middle;margin: 0 16px;cursor: pointer;" v-if="isPlay" color="#ed3f14" type="pause" :size="45"></Icon>
        <Icon @click="forward" style="vertical-align: middle;cursor: pointer;" color="#2d8cf0" type="skip-forward" :size="24"></Icon>
      </div>
      <div class="speed-control">
        <div class="info">累计：{{totalTime}}分 / {{totalDistance}} km&nbsp;&nbsp;&nbsp;</div>
        <div class="label">速度&nbsp;</div>
        <div class="value" @click="changeSpeed">&times;{{speed}} </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from 'vue';
import vueSlider from 'vue-slider-component';
import { setInterval, clearInterval } from 'timers';
var playbackInterval = null;
var MarkerWithLabel = null;
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
      gMap: null,
      allPoints: [],
      mapStyle: {}, // 去除景点
      iconPoint: require('../assets/position_point.png'),
      iconDefault: require("../assets/google-marker.png"),
      iconGreen: require('../assets/position-green.png'),
      iconStartPoint: require('../assets/marker_start_point.png'),
      iconEndPoint: require('../assets/marker_end_point.png'),
      lastMarker: null,
      hoverMarker: null,
      currentInfoWindow: null,


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
      totalDistance: 0
    }
  },
  methods: {
    // 地图加载
    initGoogleMap(center, zoom) {
      if (window.google) {
        MarkerWithLabel = require('markerwithlabel')(google.maps);
        var mapProp = {
          center: center,
          zoom: zoom,
          mapTypeId: this.gMapType
        };
        this.gMap = new google.maps.Map(
          document.getElementById("google-map-container"),
          mapProp
        );
        this.$emit("onMapReady");
      } else {
        setTimeout(() => {
          this.initGoogleMap(center, zoom);
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
        let point = this.$utils.bd09togcj02(center.lng, center.lat);
        this.gMap.setCenter({lng: point[0],lat: point[1]});
        this.gMap.setZoom(zoom - 1);
      } else {
        var bounds = new google.maps.LatLngBounds ();
        for (var i = 0; i < points.length; i++) {
          let point = new google.maps.LatLng(points[i].g_lat, points[i].g_lng);
          bounds.extend (point);
        }
        this.gMap.fitBounds (bounds);
      }

      // 清空覆盖物
      // this.gMap.clearOverlays();

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
        let startPoint = new google.maps.LatLng(item.g_lat, item.g_lng);
        let endPoint = index + 1 == points.length ? new google.maps.LatLng(item.g_lat, item.g_lng) : new google.maps.LatLng(points[index+1].g_lat, points[index+1].g_lng);
        let strokeColor = item.SpeedKmH < 30 ? "#2d8cf0" : item.SpeedKmH > 70 ? "#ed3f14" : "#19be6b";
        // 绘制折线
        var polyline = new google.maps.Polyline({
          path: [startPoint, endPoint],
          geodesic: true,       // 可测量的
          strokeColor: strokeColor,  // 线条颜色 黑色
          strokeOpacity: 1,   // 透明度 50%
          strokeWeight: 5       // 宽度 5像素
        });
        polyline.setMap(this.gMap);

        polyline.addListener("mouseout", (event) => {
          this.hoverMarker && this.hoverMarker.setMap(null);
        });
        
        polyline.addListener("mouseover", (event) => {
          this.hoverMarker && this.hoverMarker.setMap(null);
          // 绘制
          this.hoverMarker = new MarkerWithLabel({
            position: {lat: item.g_lat, lng: item.g_lng},
            draggable: false,
            raiseOnDrag: false,
            map: this.gMap,
            icon: this.iconDefault,
            labelContent: `<img src=${this.iconPoint} 
            style='transform: rotate(${item.Course}deg);vertical-align: middle;'>
            <span class='google-labels'>${item.GpsTime}</span>`,
            labelAnchor: new google.maps.Point(8, 8)
          });
          
          //点击信息窗口显示
          google.maps.event.addListener(this.hoverMarker, "click", (e) => { 
            // 关闭上一个信息窗体
            this.currentInfoWindow && this.currentInfoWindow.close();
            // 地址解析
            var geocoder = new BMap.Geocoder();
            try {
              geocoder.getLocation(new BMap.Point(item.lng, item.lat), (result) => {
                item.location = result.address || '位置解析失败';
                // 添加信息窗体
                let iw = new google.maps.InfoWindow({
                  content: `
                    <div>
                      <div><span style="font-weight: 600;">当前时间：</span>${item.GpsTime}</div>
                          <div><span style="font-weight: 600;">当前速度：</span>${item.SpeedKmH} km/h</div>
                          <div><span style="font-weight: 600;">当前坐标：</span>${item.lng.toFixed(6) +','+ item.lat.toFixed(6)}</div>
                          <div><span style="font-weight: 600;">当前地点：</span>${item.location}</div>
                    </div>`
                });
                iw.open(this.gMap, this.hoverMarker); 
                this.currentInfoWindow = iw; 
              });
            } catch (error) {
              // 打开新窗户
              let iw = new google.maps.InfoWindow({
                content: `
                  <div>
                    <div><span style="font-weight: 600;">当前时间：</span>${item.GpsTime}</div>
                        <div><span style="font-weight: 600;">当前速度：</span>${item.SpeedKmH} km/h</div>
                        <div><span style="font-weight: 600;">当前坐标：</span>${item.lng.toFixed(6) +','+ item.lat.toFixed(6)}</div>
                        <div><span style="font-weight: 600;">当前地点：</span>${item.location}</div>
                  </div>`
              });
              iw.open(this.gMap, this.hoverMarker); 
              this.currentInfoWindow = iw;
            }
            
          });

        });
      });
    },
    // 绘制起点和终点
    drawStartAndEnd(points) {
      if (points.length) {
        // 绘制起点
        let startPoint = new MarkerWithLabel({
          position: {lat: points[0].g_lat, lng: points[0].g_lng},
          draggable: false,
          raiseOnDrag: false,
          map: this.gMap,
          icon: this.iconStartPoint
        });
        
        // 绘制终点
        let endPoint = new MarkerWithLabel({
          position: {lat: points[points.length-1].g_lat, lng: points[points.length-1].g_lng},
          draggable: false,
          raiseOnDrag: false,
          map: this.gMap,
          icon: this.iconEndPoint
        });
      }
    },
    // 绘制车辆坐标
    drawMarker(item) {
      // 清楚车辆坐标点
      this.lastMarker && this.lastMarker.setMap(null);
      // 添加marker点
      this.lastMarker = new MarkerWithLabel({
        position: {lat: item.g_lat, lng: item.g_lng},
        draggable: false,
        raiseOnDrag: false,
        map: this.gMap,
        icon: this.iconDefault,
        labelContent: `<img src=${this.iconGreen} 
        style='transform: rotate(${item.Course}deg);vertical-align: middle;'>`,
        labelAnchor: new google.maps.Point(12, 10)
      });
    },
    // 改变播放速度
    changeSpeed() {
      if (this.speed == 10) {
        this.speed = 1;
      } else {
        this.speed++;
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
      if(this.allPoints.length) {
        playbackInterval = setInterval(() => {
          this.drawMarker(this.allPoints[this.slider.value]);
          this.slider.value++;
          if (this.slider.value == this.allPoints.length) {
            this.slider.value = 0;
            this.slider.tooltip = '';
            this.isPlay = false;
            this.lastMarker.setMap(null);
            clearInterval(playbackInterval);
          }
        }, 1100 - this.speed * 100)
      } else {
        this.$Message.warning('暂无该车辆轨迹信息。');
      }
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
    gMapType() {
      return this.mapType == "NORMAL_MAP" ? "roadmap" : "satellite";
    }
  },
  watch: {
    mapType(newVal) {
      this.gMap.setMapTypeId(this.gMapType);
    }
  },
  mounted() {
    this.center = this.$storage.getCorpCenter();
    this.initGoogleMap(this.center, this.zoom);
  },
  beforeDestroy() {
    let b_point = this.$utils.gcj02tobd09(this.gMap.getCenter().lng(), this.gMap.getCenter().lat());
    let center = {lat: b_point[1], lng: b_point[0]};
    let zoom = this.gMap.getZoom() + 1;
    this.$emit('onAfterCenterAndZoom', center, zoom);
  }
};
</script>