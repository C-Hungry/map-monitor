<style lang="less" scoped>
#google-map-container {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 50px;
}
</style>

<style lang="less">
  .google-labels {
    background-color: #fff;
    border: 1px solid #999;
    padding: 1px 3px;
  }
  .gmnoprint,
  .gm-fullscreen-control {
    display: none;
  }
</style>


<template>
  <div>
    <div id="google-map-container"></div>
  </div>
</template>

<script>
import { setTimeout } from "timers";
var MarkerWithLabel = null;
export default {
  props: {
    // 地图展示类型 BMAP_NORMAL_MAP：平面型  BMAP_SATELLITE_MAP：卫星图
    mapType: {
      type: String,
      default: "NORMAL_MAP"
    }
  },
  data() {
    return {
      // isInit: true, // 是否第一次加载
      zIndex: 100,
      center: null,
      zoom: 13,
      gMap: null,
      allPoints: [],
      mapStyle: {}, // 去除景点
      currentInfoWindowCarNum: "", // 当前信息窗体的carNum，点重绘后默认打开该车辆信息窗体
      currentInfoWindow: null,  // 当前信息窗体
      positionMarker: null,
      iconDefault: require("../assets/google-marker.png"),
      iconGreen: require("../assets/position-green.png"),
      iconRed: require("../assets/position-red.png"),
      iconGrey: require("../assets/position-grey.png"),

      markers: [],
      infoWindows: []

    };
  },
  methods: {
    // 地图加载
    initGoogleMap(center, zoom) {
      if (window.google) {
        MarkerWithLabel = require('markerwithlabel')(google.maps);
        var mapProp = {
          center: center,
          zoom: zoom,
          mapTypeId: this.gMapType,
          scrollwheel: true
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
    // 初始化地图数据
    initMap(points, center, zoom, isDefault) {
      
      // google地图逆解析返回值多数为null，暂考虑其他方案
      // 可参考文档地址：https://blog.csdn.net/chentao1010/article/details/8166347
      points = points.filter(item=> item.IsLocated == true);

      this.allPoints = points;
      // 如果初始化带有中心点及缩放级别代表是从地图类型切换时保留的当前中心点及缩放级别
      // 如果没有则是代表第一次数据加载时需要自动设置中心点及缩放级别
      if (center && zoom) {
        let point = this.$utils.bd09togcj02(center.lng, center.lat);
        this.gMap.setCenter({lng: point[0],lat: point[1]});
        this.gMap.setZoom(zoom - 1);
        this.drawMarker(points,false);
      } else {
        this.drawMarker(points,true);
      }
    },
    // 绘制marker点
    drawMarker(points, isFitBounds) {
      let _this = this;
      // let bounds = new google.maps.LatLngBounds();
      
      this.markers.forEach(marker => {
        marker.setMap(null);
      });

      this.markers = [];
      this.infoWindows = [];
      points.forEach(item => {
        // bounds.extend(new google.maps.LatLng(item.g_lat, item.g_lng));
        var marker = new MarkerWithLabel({
          carNum: item.CarNum,
          position: {lat: item.g_lat, lng: item.g_lng},
          draggable: false,
          raiseOnDrag: false,
          map: _this.gMap,
          icon: _this.iconDefault,
          labelContent: `<img src=${item.IsOffline ? _this.iconGrey : item.SpeedKmH == 0 ? _this.iconRed : _this.iconGreen} 
          style='transform: rotate(${item.Course}deg);vertical-align: middle;'>
          <span class='google-labels'>${item.CarNum}</span>`,
          labelAnchor: new google.maps.Point(12, 10)
        });

        let iw = new google.maps.InfoWindow({
          carNum: item.CarNum,
          content: `
            <div>
              <div><span style="font-weight: 600;">车牌号：</span>${item.CarNum}</div>
              ${item.productInfo ? `<div><span style="font-weight: 600;">货物：</span>${item.productInfo}</div>` : ''}
              ${item.consignerInfo ? `<div><span style="font-weight: 600;">发货单位：</span>${item.consignerInfo}</div>` : ''}
              ${item.receiverInfo ? `<div><span style="font-weight: 600;">收货单位：</span>${item.receiverInfo}</div>` : ''}
              ${item.dispatchTime ? `<div><span style="font-weight: 600;">派车时间：</span>${item.dispatchTime}</div>` : ''}
              <div><span style="font-weight: 600;">行驶速度：</span>${item.SpeedKmH} km/h</div>
              <div><span style="font-weight: 600;">通讯时间：</span>${item.LatestSingnalTime}</div>
              <div><span style="font-weight: 600;">定位时间：</span>${item.GpsTime}</div>
              <div><span style="font-weight: 600;">定位地点：</span>${item.location}</div>
              <div>
                <a 
                  style="
                    display: inline-block;
                    color: #fff;
                    background-color: #19be6b;
                    border-color: #19be6b;
                    padding: 2px 7px;
                    font-size: 12px;
                    margin-top: 3px;
                    border-radius: 3px;"
                  target="_blank" 
                  href="${location.href.substring(0, location.href.indexOf('#')) + 
                  '/#/map/playback?truckNo=' + item.CarNum}">
                  轨迹回放
                </a>
              </div>
            </div>`
        });
        
        // 点击信息窗体的x号
        iw.addListener("closeclick", (event) => {
          this.currentInfoWindowCarNum = "";
        });
        
        //点击信息窗口显示
        google.maps.event.addListener(marker, "click", (e) => { 
          // zIndex设置为最高
          this.zIndex++;
          marker.setZIndex(this.zIndex);

          // 关闭上一个信息窗体
          this.currentInfoWindow && this.currentInfoWindow.close();
          // 保留信息窗体的车牌号，重绘时可默认打开该信息窗体
          this.currentInfoWindowCarNum = item.CarNum;
          // 打开新窗户
          iw.open(this.gMap, marker); 
          this.currentInfoWindow = iw;
        });

        if (this.currentInfoWindowCarNum == item.CarNum) {
          this.currentInfoWindow = iw;
          iw.open(this.gMap, marker); 
        }

        this.markers.push(marker);
        this.infoWindows.push(iw);
      
      });
      // fitBounds定位中心点及缩放级别
      // this.isInit && isFitBounds && this.gMap.fitBounds(bounds);
      // this.isInit = false;
    },
     // 绘制位置，搜索栏
    drawPosition(address) {
      this.positionMarker && this.positionMarker.setMap(null);
      this.positionMarker = null;
      if (!address) {
        return;
      }
      // 地址解析
      let geocoder = new google.maps.Geocoder();
      geocoder.geocode({ 'address': address}, (results, status) => {

        if (status == google.maps.GeocoderStatus.OK) {
          if (results.length) {
            this.positionMarker = new MarkerWithLabel({
              position: {lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()},
              draggable: false,
              raiseOnDrag: false,
              map: this.gMap
            });
            this.gMap.setCenter({lng: results[0].geometry.location.lng(), lat: results[0].geometry.location.lat()});
          }
        } else {
          this.$Message.error('您输入地址没有解析到结果');
        }
      });
    },
    onInfoWindowClose() {
      // 关闭上一个信息窗体
      this.currentInfoWindow && this.currentInfoWindow.close();
    },
    openInfoWindow(point) {
      
      this.gMap.setCenter({lng: point.g_lng,lat: point.g_lat});

      let marker = this.markers.filter(item => item.carNum == point.CarNum);
      let iw = this.infoWindows.filter(item => item.carNum == point.CarNum);
      
      if (marker.length && iw.length) {
        // zIndex设置为最高
        this.zIndex++;
        marker[0].setZIndex(this.zIndex);
        
        this.currentInfoWindowCarNum = point.CarNum;
        this.currentInfoWindow = iw[0];
        iw[0].open(this.gMap, marker[0]);
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
    let center = this.$storage.getCorpCenter();
    let point = this.$utils.bd09togcj02(center.lng, center.lat);
    this.center = {lng: point[0], lat: point[1]};
    this.initGoogleMap(this.center, this.zoom);
  },
  beforeDestroy() {
    // 保存默认坐标点为百度坐标
    let b_point = this.$utils.gcj02tobd09(this.gMap.getCenter().lng(), this.gMap.getCenter().lat());
    let center = {lat: b_point[1], lng: b_point[0]};
    let zoom = this.gMap.getZoom() + 1;
    this.$emit("onAfterCenterAndZoom", center, zoom);
  }
};
</script>
