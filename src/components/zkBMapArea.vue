<style lang="less" scoped>
#baidu-map-container {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}
</style>

<template>
  <div>
    <div id="baidu-map-container"></div>
  </div>
</template>

<script>
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
      center: null,
      zoom: 15,
      bMap: null,
      drawingManager: null,
      styleOptions: {
        strokeColor:"red",    //边线颜色。
        fillColor:"red",      //填充颜色。当参数为空时，圆形将没有填充效果。
        strokeWeight: 2,       //边线的宽度，以像素为单位。
        strokeOpacity: 0.8,	   //边线透明度，取值范围0 - 1。
        fillOpacity: 0.2,      //填充的透明度，取值范围0 - 1。
        strokeStyle: 'solid' //边线的样式，solid或dashed。
      },
      graphType: 1, // 1：圆，2：矩形，3：多边形
      centerMarker: null,
      circleInstance: null,
      rectInstance: null,
      polygonInstance: null,
      circle: {
        center: {
          lat: 0,
          lng: 0
        },
        address: null,
        radius: 0
      },
      rect: {
        center: {
          lat: 0,
          lng: 0
        },
        address: null,
        points: []
      },
      polygon: {
        center: {
          lat: 0,
          lng: 0
        },
        address: null,
        points: []
      },
      mapStyle: {}, // 去除景点
      iconPoint: require('../assets/position_point.png'),
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

        this.drawingManager = new BMapLib.DrawingManager(this.bMap, {
          isOpen: false, //是否开启绘制模式
          enableDrawingTool: false, //是否显示工具栏
          drawingToolOptions: {
              anchor: BMAP_ANCHOR_TOP_RIGHT, //位置
              offset: new BMap.Size(5, 5), //偏离值
          },
          circleOptions: this.styleOptions, //圆的样式
          polygonOptions: this.styleOptions, //多边形的样式
          rectangleOptions: this.styleOptions //矩形的样式
        });  
        // 监听圆形绘制完成
        this.drawingManager.addEventListener('circlecomplete', this.onDrawCircleComplete);
        // 监听多边形绘制完成
        this.drawingManager.addEventListener('polygoncomplete', this.onDrawPolygonComplete);
        // 监听矩形绘制完成
        this.drawingManager.addEventListener('rectanglecomplete', this.onDrawRectComplete);

        this.$emit("onMapReady");
      } else {
        setTimeout(() => {
          this.initBaiduMap(center, zoom);
        }, 1000);
      }
    },
    // 绘制所选位置
    drawPointByAddress(address) {
      if (!address) return;
      var geocoder = new BMap.Geocoder();
      geocoder.getPoint(address, (point) => {
        if (point) {
          this.bMap.clearOverlays();
          this.bMap.centerAndZoom(point, 16);
          this.bMap.addOverlay(new BMap.Marker(point));
        } else {
          this.$Message.error('解析位置信息失败，请输入详细地址。');
        }
      });
    },
    // 重绘
    drawGraph(data) {
      !this.drawingManager._isOpen && this.bMap.clearOverlays();

      this.circleInstance = null;
      this.rectInstance = null;
      this.polygonInstance = null;

      if (data.graphType == 1) {
        this.drawingManager.setDrawingMode(BMAP_DRAWING_CIRCLE);
      } 
      else if (data.graphType == 2) {
        this.drawingManager.setDrawingMode(BMAP_DRAWING_RECTANGLE);
      } 
      else if (data.graphType == 3) {
        this.drawingManager.setDrawingMode(BMAP_DRAWING_POLYGON);
      } 
      else {

      }
      
      this.circle = {
        center: {
          lat: 0,
          lng: 0
        },
        address: null,
        radius: 0
      };

      this.rect = {
        center: {
          lat: 0,
          lng: 0
        },
        address: null,
        points: []
      };

      this.polygon = {
        center: {
          lat: 0,
          lng: 0
        },
        address: null,
        points: []
      }

      this.drawingManager.open();

    },
    // 绘制坐标中心点
    drawCenterMarker(data) {
      this.centerMarker && this.bMap.removeOverlay(this.centerMarker);
      this.centerMarker = null;
      let point = new BMap.Point(data.lng, data.lat);
      this.centerMarker = new BMap.Marker(point);
      this.bMap.addOverlay(this.centerMarker);
    },
    // 位置解析
    getLocation(data) {
      return new Promise((resolve, reject) => {
        let geoc = new BMap.Geocoder();
        let pt = new BMap.Point(data.lng, data.lat);
        geoc.getLocation(pt, (rs) => {
          let addComp = rs.addressComponents;
          let codeArr = this.queryAddressCode(addComp);
          let addressObj = {
            address: `${addComp.province}${addComp.city}${addComp.district}${addComp.street}${addComp.streetNumber}`,
            code: codeArr
          }
          resolve(addressObj);
        }); 
      })
    },
    // 绘制圆形完成后
    onDrawCircleComplete(circle) {
      this.circleInstance = circle;
      let circleCenter = circle.getCenter();
      let circleRadius = circle.getRadius();

      if(circleRadius < 100) {
        this.circleInstance.setRadius(100);
        circleRadius = 100;
      }

      if(circleRadius > 5000) {
        this.circleInstance.setRadius(5000);
        circleRadius = 5000;
      }

      this.circle = {
        center: {
          lat: circleCenter.lat,
          lng: circleCenter.lng
        },
        address: null,
        radius: circleRadius
      }

      this.drawCenterMarker(this.circle.center);

      this.getLocation(this.circle.center).then(res=> {
        this.circle.address = res;
        this.$emit('onDrawComplete', this.circle, 'circle');
      });

      this.drawingManager.close();
    },
    // 监听矩形绘制完毕
    onDrawRectComplete(overlay) {
      this.rectInstance = overlay;
      // 可编辑，编辑后回填值

      let points = this.rectInstance.getPath();
      let viewport = this.bMap.getViewport(points);
      let center = viewport.center;
      
      this.rect = {
        center: {
          lat: viewport.center.lat,
          lng: viewport.center.lng
        },
        address: null,
        points: points
      }

      this.drawCenterMarker(this.rect.center);

      this.getLocation(this.rect.center).then(res=> {
        this.rect.address = res;
        this.$emit('onDrawComplete', this.rect, 'rect');
      });

      this.drawingManager.close();
    },
    // 监听多边形绘制完成
    onDrawPolygonComplete(overlay) {
      this.polygonInstance = overlay;
      // 可编辑，编辑后回填值
      this.polygonInstance.enableEditing();
      this.polygonInstance.addEventListener('lineupdate', (e) => {
        this.handleLineUpdate();
      });
      this.handleLineUpdate();
      this.drawingManager.close();
    },
    handleLineUpdate() {
      let points = this.polygonInstance.getPath();
      let viewport = this.bMap.getViewport(points);
      let center = viewport.center;
      
      this.polygon = {
        center: {
          lat: viewport.center.lat,
          lng: viewport.center.lng
        },
        address: null,
        points: points
      }

      this.drawCenterMarker(this.polygon.center);

      this.getLocation(this.polygon.center).then(res=> {
        this.polygon.address = res;
        this.$emit('onDrawComplete', this.polygon, 'polygon');
      });
    },
    // 监听圆形半径变化
    onRadiusChange(radius) {
      this.circleInstance && this.circleInstance.setRadius(radius);
    },
    // 回填值
    backfill(data) {

      this.drawingManager.close();

      let point = new BMap.Point(data.centerLng, data.centerLat);
      this.centerMarker = new BMap.Marker(point);
      this.bMap.addOverlay(this.centerMarker);
      this.bMap.setCenter(point);
      let center = {
        lat: data.centerLat,
        lng: data.centerLng
      }
      let address = data.centerAddress;
      let radius = data.radius;
      let code = [data.province, data.city, data.province];

      if (data.graphType == 1) {
        this.circle = {
          center: center,
          address: {
            address: address,
            code: code
          },
          radius: radius
        }
        this.circleInstance = new BMap.Circle(point, data.radius,this.styleOptions); 
        this.bMap.addOverlay(this.circleInstance);
      }
      else if (data.graphType == 2) {
        let path = JSON.parse(data.areaPoints);
        let points = [];
        path.forEach(item => {
          points.push(new BMap.Point(item.Lng,item.Lat));
        })
        this.rect = {
          center: center,
          address: {
            address: address,
            code: code
          },
          points: points
        }

        let viewport = this.bMap.getViewport(points);
        this.bMap.setZoom(viewport.zoom);

        this.rectInstance = new BMap.Polygon(points, this.styleOptions);
        this.bMap.addOverlay(this.rectInstance);
      }
      else if (data.graphType == 3) {
        let path = JSON.parse(data.areaPoints);
        let points = [];
        path.forEach(item => {
          points.push(new BMap.Point(item.Lng,item.Lat));
        })
        this.polygon = {
          center: center,
          address: {
            address: address,
            code: code
          },
          points: points
        }

        let viewport = this.bMap.getViewport(points);
        this.bMap.setZoom(viewport.zoom);

        this.polygonInstance = new BMap.Polygon(points, this.styleOptions);
        
        this.polygonInstance.addEventListener('lineupdate', (e) => {
          this.handleLineUpdate();
        });
        this.bMap.addOverlay(this.polygonInstance);
        this.polygonInstance.enableEditing();
      }
      else {

      }

    },
    // 获取行政编号
    queryAddressCode(data) {
      // 县级市city可能为空
      data.city = data.city || data.district;
       
      let provinceCode = '';
      let cityCode = '';
      let countryCode= '';

      if (!this.cascaderAddressData) {
        this.cascaderAddressData = this.$storage.getCascaderAddress();
      }

      for (let i = 0; i < this.cascaderAddressData.length; i++) {
        if (this.cascaderAddressData[i].name == data.province && !this.cascaderAddressData[i].parent) {
          provinceCode = this.cascaderAddressData[i].value;
          break;
        }
      }

      if (!provinceCode) {
        for (let i = 0; i < this.cascaderAddressData.length; i++) {
          if (data.province.indexOf(this.cascaderAddressData[i].alias) > -1) {
            provinceCode = this.cascaderAddressData[i].value;
            break;
          }
        }
      }

      for (let i = 0; i < this.cascaderAddressData.length; i++) {
        if (this.cascaderAddressData[i].name == data.city && this.cascaderAddressData[i].parent == provinceCode) {
          cityCode = this.cascaderAddressData[i].value;
          break;
        }
      }

      if (!cityCode) {
        for (let i = 0; i < this.cascaderAddressData.length; i++) {
          if (data.city.indexOf(this.cascaderAddressData[i].alias) > -1 && this.cascaderAddressData[i].parent == provinceCode) {
            cityCode = this.cascaderAddressData[i].value;
            break;
          }
        }
      }

       for (let i = 0; i < this.cascaderAddressData.length; i++) {
        if (this.cascaderAddressData[i].name == data.district && this.cascaderAddressData[i].parent == cityCode) {
          countryCode = this.cascaderAddressData[i].value;
          break;
        }
      }

      if (!countryCode) {
        for (let i = 0; i < this.cascaderAddressData.length; i++) {
          if (data.district.indexOf(this.cascaderAddressData[i].alias) > -1 && this.cascaderAddressData[i].parent == cityCode) {
            countryCode = this.cascaderAddressData[i].value;
            break;
          }
        }
      }

      if (provinceCode && cityCode && countryCode) {
        return [provinceCode, cityCode, countryCode];
      }
      else {
        this.$vux.toast.text("找不到所选区域的行政编码！请联系客服处理，电话：400 1617 400！", "default");
        return [];
      }
    },
    
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