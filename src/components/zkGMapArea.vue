<style lang="less" scoped>
#google-map-container {
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
    <div id="google-map-container"></div>
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
      zoom: 14,
      gMap: null,
      drawingManager: null,
      styleOptions: {
        strokeColor:"red",    //边线颜色。
        fillColor:"red",      //填充颜色。当参数为空时，圆形将没有填充效果。
        strokeWeight: 2,      //边线的宽度，以像素为单位。
        strokeOpacity: 0.8,	  //边线透明度，取值范围0 - 1。
        fillOpacity: 0.2,     //填充的透明度，取值范围0 - 1。
        strokeStyle: 'solid'  //边线的样式，solid或dashed。
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
        address: null
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
    initGoogleMap(center, zoom) {
      if (window.google) {
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

        this.drawingManager = new google.maps.drawing.DrawingManager({
          drawingMode: google.maps.drawing.OverlayType.MARKER,
          drawingControl: false,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: ['marker', 'circle', 'polygon', 'rectangle']
          },
          circleOptions: this.styleOptions, //圆的样式
          polygonOptions: this.styleOptions, //多边形的样式
          rectangleOptions: this.styleOptions //矩形的样式
        });

        // 监听圆形绘制完成
        google.maps.event.addListener(this.drawingManager, 'circlecomplete', this.onDrawCircleComplete);
        // 监听多边形绘制完成
        google.maps.event.addListener(this.drawingManager, 'polygoncomplete', this.onDrawPolygonComplete);
        // 监听矩形绘制完成
        google.maps.event.addListener(this.drawingManager, 'rectanglecomplete', this.onDrawRectComplete);

        this.$emit("onMapReady");
      } else {
        setTimeout(() => {
          this.initGoogleMap(center, zoom);
        }, 1000);
      }
    },
    // 绘制所选位置
    drawPointByAddress(address) {
      if (!address) return;
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({'address': address}, (results, status) => {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results.length) {
            let point = results[0].geometry.location;
            this.gMap.setCenter(point);
            this.drawCenterMarker(point);
          } else {
            this.$Message.error('解析位置信息失败，请输入详细地址。');
          }
        } else {
          this.$Message.error('解析位置信息失败，请输入详细地址。');
        }
      });
    },
    // 重绘
    drawGraph(data) {
      // !this.drawingManager._isOpen && this.bMap.clearOverlays();
      this.drawingManager && this.drawingManager.setMap(null);
      this.circleInstance && this.circleInstance.setMap(null);
      this.rectInstance && this.rectInstance.setMap(null);
      this.polygonInstance && this.polygonInstance.setMap(null);
      this.centerMarker && this.centerMarker.setMap(null);
      this.circleInstance = null;
      this.rectInstance = null;
      this.polygonInstance = null;
      this.centerMarker = null;

      if (data.graphType == 1) {
        this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.CIRCLE);
      } 
      else if (data.graphType == 2) {
        this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.RECTANGLE);
      } 
      else if (data.graphType == 3) {
        this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);
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

      this.drawingManager.setMap(this.gMap);

    },
    // 绘制坐标中心点
    drawCenterMarker(point) {
      this.centerMarker && this.centerMarker.setMap(null);
      this.centerMarker = null;
      this.centerMarker = new google.maps.Marker({position: point, map: this.gMap});
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
      let circleCenter = {lng: circle.getCenter().lng(), lat: circle.getCenter().lat()};
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
        let params = Object.assign({}, this.circle);

        params.center = {
          lat: this.$utils.gcj02tobd09(circleCenter.lng, circleCenter.lat)[1],
          lng: this.$utils.gcj02tobd09(circleCenter.lng, circleCenter.lat)[0]
        }
        
        this.$emit('onDrawComplete', params, 'circle');
      });

      this.drawingManager.setMap(null);
    },
    // 监听矩形绘制完毕
    onDrawRectComplete(overlay) {
      this.rectInstance = overlay;
      // 可编辑，编辑后回填值

      let bound = this.rectInstance.getBounds();

      let points = [
        {lng: bound.ga.j, lat: bound.ma.j},
        {lng: bound.ga.l, lat: bound.ma.j},
        {lng: bound.ga.l, lat: bound.ma.l},
        {lng: bound.ga.j, lat: bound.ma.l}
      ]

      let bounds = new google.maps.LatLngBounds();
      points.forEach(item => {
        bounds.extend(new google.maps.LatLng(item.lat, item.lng));
      })
      let center = bounds.getCenter();
      
      this.rect = {
        center: {
          lat: center.lat(),
          lng: center.lng()
        },
        address: null,
        points: points
      }

      this.drawCenterMarker(this.rect.center);

      this.getLocation(this.rect.center).then(res=> {
        this.rect.address = res;
        let params = Object.assign({}, this.rect);

        params.center = {
          lat: this.$utils.gcj02tobd09(this.rect.center.lng, this.rect.center.lat)[1],
          lng: this.$utils.gcj02tobd09(this.rect.center.lng, this.rect.center.lat)[0]
        }
        params.points = params.points.map(item =>{
          item = {
            lat: this.$utils.gcj02tobd09(item.lng, item.lat)[1],
            lng: this.$utils.gcj02tobd09(item.lng, item.lat)[0]
          }
          return item;
        })

        this.$emit('onDrawComplete', params, 'rect');
      });

      this.drawingManager.setMap(null);
    },
    // 监听多边形绘制完成
    onDrawPolygonComplete(overlay) {
      this.polygonInstance = overlay;
      // 可编辑，编辑后回填值
      this.polygonInstance.setEditable(true);

      google.maps.event.addListener(this.polygonInstance, 'mouseup', (e) => {
        this.handleLineUpdate();
      });

      this.handleLineUpdate();
      this.drawingManager.setMap(null);
    },
    handleLineUpdate() {
      let path = (this.polygonInstance.getPath() && this.polygonInstance.getPath().j) || [];
      let points = [];
      let bounds = new google.maps.LatLngBounds();
      path.forEach(item => {
        points.push({
          lat: item.lat(),
          lng: item.lng()
        })
        bounds.extend(new google.maps.LatLng(item.lat(), item.lng()));
      })
      let center = bounds.getCenter();
      
      this.polygon = {
        center: {
          lat: center.lat(),
          lng: center.lng()
        },
        address: null,
        points: points
      }

      this.drawCenterMarker(this.polygon.center);

      this.getLocation(this.polygon.center).then(res=> {
        this.polygon.address = res;
        let params = Object.assign({}, this.polygon);

        params.center = {
          lat: this.$utils.gcj02tobd09(this.polygon.center.lng, this.polygon.center.lat)[1],
          lng: this.$utils.gcj02tobd09(this.polygon.center.lng, this.polygon.center.lat)[0]
        }

        params.points = params.points.map(item =>{
          item = {
            lat: this.$utils.gcj02tobd09(item.lng, item.lat)[1],
            lng: this.$utils.gcj02tobd09(item.lng, item.lat)[0]
          }
          return item;
        })

        this.$emit('onDrawComplete', params, 'polygon');
      });
    },
    // 监听圆形半径变化
    onRadiusChange(radius) {
      this.circleInstance && this.circleInstance.setRadius(radius);
    },
    // 回填值
    backfill(data) {

      let center = {
        lat: this.$utils.bd09togcj02(data.centerLng, data.centerLat)[1],
        lng: this.$utils.bd09togcj02(data.centerLng, data.centerLat)[0]
      }
      let address = data.centerAddress;
      let radius = data.radius;
      let code = [data.province, data.city, data.province];
      this.drawCenterMarker(center);
      this.gMap.setCenter(center);

      if (data.graphType == 1) {
        this.circle = {
          center: center,
          address: {
            address: address,
            code: code
          },
          radius: radius
        }

        this.circleInstance = new google.maps.Circle(Object.assign({}, {
          center: center,
          radius: radius,
        }, this.styleOptions));  

        this.circleInstance.setMap(this.gMap);

      }
      else if (data.graphType == 2) {
        let path = JSON.parse(data.areaPoints);
        let points = [];
        let bounds = new google.maps.LatLngBounds();
        path.forEach(item => {
          points.push({
            lat: this.$utils.bd09togcj02(item.Lng, item.Lat)[1],
            lng: this.$utils.bd09togcj02(item.Lng, item.Lat)[0]
          })
          bounds.extend(new google.maps.LatLng(this.$utils.bd09togcj02(item.Lng, item.Lat)[1], this.$utils.bd09togcj02(item.Lng, item.Lat)[0]));
        })

        this.rect = {
          center: center,
          address: {
            address: address,
            code: code
          },
          points: points
        }

        this.gMap.fitBounds(bounds);

        this.rectInstance = new google.maps.Rectangle(Object.assign({}, {
          bounds: bounds
        }, this.styleOptions));  
        this.rectInstance.setMap(this.gMap);

      }
      else if (data.graphType == 3) {
        let path = JSON.parse(data.areaPoints);
        let points = [];
        let bounds = new google.maps.LatLngBounds();
        path.forEach(item => {
          points.push({
            lat: this.$utils.bd09togcj02(item.Lng, item.Lat)[1],
            lng: this.$utils.bd09togcj02(item.Lng, item.Lat)[0]
          })
          bounds.extend(new google.maps.LatLng(this.$utils.bd09togcj02(item.Lng, item.Lat)[1], this.$utils.bd09togcj02(item.Lng, item.Lat)[0]));
        })
        this.polygon = {
          center: center,
          address: {
            address: address,
            code: code
          },
          points: points
        }

        this.gMap.fitBounds(bounds);

        this.polygonInstance = new google.maps.Polygon(Object.assign({}, {
          paths: points,
          editable: true
        }, this.styleOptions));  
        google.maps.event.addListener(this.polygonInstance, 'mouseup', (e) => {
          this.handleLineUpdate();
        });
        this.polygonInstance.setMap(this.gMap);
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