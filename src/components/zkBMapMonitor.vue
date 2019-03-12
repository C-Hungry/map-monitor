<style lang="less" scoped>
#baidu-map-container {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 50px;
}
</style>

<template>
  <div>
    <div id="baidu-map-container"></div>
  </div>
</template>

<script>
import Vue from 'vue';
export default {
  props: {
    // 地图展示类型 NORMAL_MAP：平面型  SATELLITE_MAP：卫星图
    mapType: { 
      type: String,
      default: "NORMAL_MAP"
    },
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
      currentInfoWindowCarNum: "", // 当前信息窗体的carNum，点重绘后默认打开该车辆信息窗体
      currentInfoWindow: null,  // 当前信息窗体
      positionMarker: null,
      iconGreen: require('../assets/position-green.png'),
      iconRed: require('../assets/position-red.png'),
      iconGrey: require('../assets/position-grey.png')
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
    initMap(points, center, zoom, isDefault) {
      
      points = points.filter(item=> item.IsLocated == true);
      
      this.allPoints = points;
      // center和zoom为百度与谷歌地图切换的预设值
      // isDefault是否保留地图的
      if (center && zoom) {
        let point = new BMap.Point(center.lng, center.lat);
        this.bMap.setCenter(point);
        this.bMap.setZoom(zoom);
      }
      // else {
      //   if (this.isInit) {
      //     let view = this.bMap.getViewport(points);
      //     let point = new BMap.Point(view.center.lng, view.center.lat);
      //     let zoom = view.zoom > 13 ? 13 : view.zoom;
      //     this.bMap.setCenter(point);
      //     this.bMap.setZoom(zoom);
      //   }
      // }
      // this.isInit = false;
    
      this.drawMarker(points);

    },
    // 绘制marker点
    drawMarker(points) {
      let _this = this;
      // 清空覆盖物
      this.bMap.clearOverlays();

      // 添加搜索点
      if (this.positionMarker) {
        this.bMap.addOverlay(this.positionMarker);
        this.positionMarker.setAnimation(BMAP_ANIMATION_BOUNCE);
      }
      
      points.forEach(item => {
        // 添加marker点
        var point = new BMap.Point(item.lng, item.lat);
        var marker = new BMap.Marker(point, {
          truckNo: point.CarNum,
          icon: new BMap.Icon(item.IsOffline ? this.iconGrey : item.SpeedKmH == 0 ? this.iconRed : this.iconGreen, new BMap.Size(20,20)),
          rotation: item.Course,
        })
        this.bMap.addOverlay(marker);

        // 添加label
        var label = new BMap.Label(item.CarNum,{offset:new BMap.Size(26, 0)});
        label.setStyle({
          fontSize: '12px',
          borderColor: '#ccc',
          padding: '1px 3px'
        });
        marker.setLabel(label);
        
        // 添加信息窗体
        var iwContent = `
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
                  '/#/map/playback?truckNo=' + item.CarNum }">
                 轨迹回放
              </a>
            </div>
          </div>`;

        var infoWindow = new BMap.InfoWindow(iwContent);
        // 点击信息窗体的x号
        infoWindow.addEventListener("clickclose", (event) => {
          this.currentInfoWindowCarNum = "";
        });

        marker.addEventListener("click", (event) => {
          // zIndex设置为最高
          marker.setTop(true);
          // 关闭上一个信息窗体
          this.bMap.closeInfoWindow(); 
          // 保留信息窗体的车牌号，重绘时可默认打开该信息窗体
          this.currentInfoWindowCarNum = item.CarNum;
          // 打开新窗户
          this.bMap.openInfoWindow(infoWindow, point);
        });

        // 重绘后保持默认打开
        if (this.currentInfoWindowCarNum == item.CarNum) {
          this.bMap.openInfoWindow(infoWindow, point);
        }

      });
    },
    // 绘制位置，搜索栏
    drawPosition(address) {
      this.positionMarker && this.bMap.removeOverlay(this.positionMarker);
      this.positionMarker = null;
      if (!address) {
        return;
      }
      // 地址解析
      var geocoder = new BMap.Geocoder();
      geocoder.getPoint(address.trim(), (point) => {
        if (point) {
          this.bMap.setCenter(point);
          this.positionMarker = new BMap.Marker(point);
          this.bMap.addOverlay(this.positionMarker);
          this.positionMarker.setAnimation(BMAP_ANIMATION_BOUNCE);
        }else{
          this.$Message.error('您输入地址没有解析到结果');
        }
      });
    },
    // 监听信息窗口关闭
    onInfoWindowClose () {
      // 关闭上一个信息窗体
      this.bMap.closeInfoWindow();
    },
    // 打开信息窗口
    openInfoWindow(point) {
      // 设置中心点
      let p = new BMap.Point(point.lng, point.lat);
      this.bMap.setCenter(p);
      // 提升zIndex
      let allOverlay = this.bMap.getOverlays();
      for (let i = 0; i < allOverlay.length; i++){
        if(allOverlay[i].getLabel().content == point.CarNum){
          allOverlay[i].setTop(true)
          break;
        }
      }

      var iwContent = `
        <div>
          <div><span style="font-weight: 600;">车牌号：</span>${point.CarNum}</div>
          ${point.productInfo ? `<div><span style="font-weight: 600;">货物：</span>${point.productInfo}</div>` : ''}
          ${point.consignerInfo ? `<div><span style="font-weight: 600;">发货单位：</span>${point.consignerInfo}</div>` : ''}
          ${point.receiverInfo ? `<div><span style="font-weight: 600;">收货单位：</span>${point.receiverInfo}</div>` : ''}
          ${point.dispatchTime ? `<div><span style="font-weight: 600;">派车时间：</span>${point.dispatchTime}</div>` : ''}
          <div><span style="font-weight: 600;">行驶速度：</span>${point.SpeedKmH} km/h</div>
          <div><span style="font-weight: 600;">通讯时间：</span>${point.LatestSingnalTime}</div>
          <div><span style="font-weight: 600;">定位时间：</span>${point.GpsTime}</div>
          <div><span style="font-weight: 600;">定位地点：</span>${point.location}</div>
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
                  '/#/map/playback?truckNo=' + point.CarNum}">
                轨迹回放
            </a>
          </div>
        </div>`
      var infoWindow = new BMap.InfoWindow(iwContent); 
      this.bMap.openInfoWindow(infoWindow, p);
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