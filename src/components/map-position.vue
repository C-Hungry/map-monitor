<style lang="less" scoped>
.map-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  .map-body {
    flex: 1;
    background-color: #DDD;
    .map {
      width: 100%;
      height: 100%;
    }
  }
  .footer {
    position: relative;
    min-height: 130px;
    padding: 3px 0 0 0;
    background-color: #FFF;
    .slider {
      position: absolute;
      top: -36px;
      right: 10px;
      height: 25px;

    }
    .item {
      display: flex;
      margin: 12px auto;
      padding: 0 10px;
      .label {
        font-weight: 600;
        vertical-align: middle;
      }
      .value {
        flex: 1
      }
    }
    .btn {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: #28b8f7;
    }
  }
}
</style>

<style lang="less">
.vux-search-box{
  margin-top: -50px;
  .weui-search-bar__box{
    // background: rgb(239,239,244);
    background: white;
  }
  .weui-search-bar__cancel-btn{
    z-index: 999;
    color: #2d8cf0;
  }
}
.map-container {
  .vux-inline-x-number {
    background-color: #FFF;
  }
  .vux-number-input {
    font-size: 14px;
    height: 30px;
  }
  .vux-number-selector-plus {
    margin-right: 0;
  }
  .vux-number-selector{
    height: 30px;
  }
}
.search-popup {
  .weui-cells {
    margin-top: 0;
    line-height: 18px;
    font-size: 14px;
    .vux-label-desc {
      color: #999;
    }
  }
}
</style>


<template>
  <div v-transfer-dom>
    <popup style="background-color: #FFF" v-model="visible" position="bottom" height="100%">
      <div class="map-container">
        <x-header :left-options="{preventGoBack: true, backText: '关闭'}" @on-click-back="visible=false"  title="请选择"></x-header>
        <search
          v-model="keyword"
          top="0"
          :auto-fixed="false"
          ref="map-search">
        </search>
        <div v-if="isSearching" style="position: fixed;top: 35px;right: 10px;z-index: 100;color:red;">地址检索中...</div>
        <div class="map-body">

          <div id="baidu-map-container" style="height: 100%;" ref="mapPosition"></div>

        </div>
        <div class="footer" v-if="isShowFooter">  
          <div class="slider">
            <inline-x-number v-model="radius" :min="50" :max="1000" :step="50"></inline-x-number>
          </div>
          <div class="item">
            <span class="label">位置信息：</span>
            <span class="value">{{addressForm.addressDetail || '--'}}</span>
          </div>
          <div class="item">
            <span class="label">地址名称：</span>
            <input v-model="addressForm.additionalRemark" style="-webkit-appearance: none;font-size: 14px;height: 18px;padding: 6px 4px;border-radius: 2px;border:1px solid #ccc;outline:none;margin-top: -5px;" maxlength="20" type="text">      
          </div>
          <x-button class="btn" type="primary" @click.native="onBtnOk">保存</x-button>
        </div>
      </div>
    </popup>
    <popup v-model="isShowSearchValue" position="bottom" max-height="40%">
      <div class="search-popup">
        <group>
          <cell v-for="(item, index) in searchList" :key="index" :title="item.title" :inline-desc='item.address' @click.native="onCellClick(item.point)"></cell>
        </group>
      </div>
    </popup>
  </div>
</template>

<script>
import { XButton, TransferDom, PopupHeader, Popup, InlineXNumber, Search, Group, Cell, XHeader } from 'vux';
import { setTimeout } from 'timers';

export default {
  directives: {
    TransferDom
  },
  components: {
    XButton,
    PopupHeader,
    Popup,
    InlineXNumber,
    Search, 
    Group,
    Cell,
    XHeader,
  },
  data() {
    return {
      bMap: null,
      visible: true,
      isShowSearchValue: false,
      isShowFooter: true,
      isSearching: false,
      searchList:[],
      keyword: "",
      center: {lng: 108.950398, lat: 34.345945},
      zoom: 14,
      otherCenter: {},
      radius: 200,
      isShowCircle: true,
      isDraging: false,
      addressForm: {
        areaCode: [], // 行政编号code
        addressDetail: '', // 街道详情地址
        addressDetail: '', // 百度解析地址
        additionalRemark: '', // 补充说明
        center: {lng: 0,lat: 0},// 坐标中心点
        polygonPath: [], // 采用多边形绘制的轨迹
        radius: 200 // 采用点绘制时的半径（米）
      },
      // 保存用户操作 add为新增 editor为编辑
      userAction: 'add',
    }
  },
  methods: {
    // 地图加载
    initBaiduMap(center, zoom) {
      this.$vux.loading.show("加载中");
      let _this = this;
      this.bMap = new BMap.Map("baidu-map-container"); // 创建Map实例
      // 设置地图类型
      this.bMap.setMapType(BMAP_NORMAL_MAP);
      if (window.BMap) {
        // 根据浏览器定位
        var geolocation = new BMap.Geolocation();
        geolocation.getCurrentPosition(function(r){
          if(this.getStatus() == BMAP_STATUS_SUCCESS){
            _this.center = r.point;
            _this.addressForm.center = r.point;
            _this.getLocation(r.point);
            _this.bMap.centerAndZoom(r.point, _this.zoom);
            _this.drawCircle();
            _this.drawMarker();
            _this.$vux.loading.hide();
          }
        },{enableHighAccuracy: true})
        this.handler();
        this.$vux.loading.hide();
      } else {
        let this_ = this;
        setTimeout(() => {
          this_.initBaiduMap(center, zoom);
          this_.addressForm.center = center;
          this_.drawCircle();
          this_.drawMarker();
          this_.getLocation(this_.addressForm.center);
          this.$vux.loading.hide();
        }, 1000);
      }
    },
    init(data, center) {
      try {
        let _this = this;
        this.addressForm = Object.assign({},data);
        this.addressForm.center = center;
        this.addressForm.center = this.addressForm.centerLng && this.addressForm.centerLat ? new BMap.Point(this.addressForm.centerLng, this.addressForm.centerLat) : new BMap.Point(0, 0);
        this.visible = true;
        this.loading = true;
        this.$vux.loading.show({text: '定位中...'});
        if (data.center == "{}") {
          // 获取当前位置
          new BMap.Geolocation().getCurrentPosition(function(r){
            _this.loading = false;
            _this.$vux.loading.hide();
            if(this.getStatus() == BMAP_STATUS_SUCCESS){
              setTimeout(()=>{
                _this.center = r.point;
                _this.addressForm.center = r.point;
                _this.getLocation(r.point);
                _this.bMap.centerAndZoom(r.point, _this.zoom);
                _this.drawCircle();
                _this.drawMarker();
              },100)
            } 
            else {
              _this.$vux.toast.text("获取当前位置失败！", "default");
            }       
          },{enableHighAccuracy: true})
        }
        else {
          // 省市区code
          this.addressForm.areaCode = [data.province, data.city, data.county];
          // 街道详情地址
          this.addressForm.addressDetail = data.description;
          // 补充说明
          this.addressForm.additionalRemark = data.areaName;
          // 采用点绘制时的半径（米）
          this.addressForm.radius = data.radius;
          // id保存
          this.addressForm.areaId = data.areaId;
          setTimeout(()=>{
            _this.$vux.loading.hide();
            _this.center = _this.addressForm.center;
            _this.radius = _this.addressForm.radius;
            _this.bMap.centerAndZoom(_this.center, _this.zoom);
            _this.getLocation(_this.addressForm.center);
            _this.drawCircle();
            _this.drawMarker();
          },100)
        }
      }
      catch (error) {
        console.log(error)
        this.$vux.loading.hide();
        this.$vux.toast.text("加载地图失败！", "default");
      }
    },
    // 地图ready事件
    handler() {
      // 监听地图拖拽事件
      let _this = this;
      this.bMap.addEventListener('ondragend',function() {
        _this.isShowSearchValue = false;
        let point = _this.bMap.getCenter();
        _this.addressForm.center = point;
        _this.drawCircle();
        _this.drawMarker();
        _this.getLocation(point);
      })
    },
    // 位置逆解析 回填三级级联及详细地址
    getLocation(point) {
      let this_ = this;
      new BMap.Geocoder().getLocation(point, (data) => {
        if (data.surroundingPois.length > 0) {
          this_.addressForm.addressDetail = data.surroundingPois[0].address + data.surroundingPois[0].title;
        } 
        else {
          this_.addressForm.addressDetail = data.address;
        }
        this.queryAddressCode(data.addressComponents);
        // 强制页面更新
        this.$forceUpdate();
      })
    },
    // 获取预估距离
    // getEstimateDistance() {
    //   if (this.otherCenter == '{}') {
    //     return;
    //   }
    //   this.$emit('on-estimate', this.bMap.getDistance(this.addressForm.center, this.otherCenter));
    // },
    //绘制圆
    drawCircle() {
      this.bMap.clearOverlays();
      let circle = new BMap.Circle(this.addressForm.center, this.radius, {strokeColor:"red", strokeWeight:2, strokeOpacity:0.5});
      this.bMap.addOverlay(circle);
    },
    //添加覆盖物
    drawMarker() {
      var myIcon = new BMap.Icon( require("../assets/mapPositionImg.png"), new BMap.Size(40,40));
      let marker = new BMap.Marker(this.addressForm.center, {
        offset: {width: 6,height: -14}, 
        icon: myIcon,
        
      });
      this.bMap.addOverlay(marker);
    },
    // 获取行政编号
    queryAddressCode(data) {
      // 县级市city可能为空
      data.city = data.city || data.district;
       
      let provinceCode = '';
      let cityCode = '';
      let countryCode= '';

      if (!this.addressData) {
        this.addressData = this.$storage.getCascaderAddress();
      }

      for (let i = 0; i < this.addressData.length; i++) {
        if (this.addressData[i].name == data.province && !this.addressData[i].parent) {
          provinceCode = this.addressData[i].value;
          break;
        }
      }

      if (!provinceCode) {
        for (let i = 0; i < this.addressData.length; i++) {
          if (data.province.indexOf(this.addressData[i].alias) > -1) {
            provinceCode = this.addressData[i].value;
            break;
          }
        }
      }

      for (let i = 0; i < this.addressData.length; i++) {
        if (this.addressData[i].name == data.city && this.addressData[i].parent == provinceCode) {
          cityCode = this.addressData[i].value;
          break;
        }
      }

      if (!cityCode) {
        for (let i = 0; i < this.addressData.length; i++) {
          if (data.city.indexOf(this.addressData[i].alias) > -1 && this.addressData[i].parent == provinceCode) {
            cityCode = this.addressData[i].value;
            break;
          }
        }
      }

       for (let i = 0; i < this.addressData.length; i++) {
        if (this.addressData[i].name == data.district && this.addressData[i].parent == cityCode) {
          countryCode = this.addressData[i].value;
          break;
        }
      }

      if (!countryCode) {
        for (let i = 0; i < this.addressData.length; i++) {
          if (data.district.indexOf(this.addressData[i].alias) > -1 && this.addressData[i].parent == cityCode) {
            countryCode = this.addressData[i].value;
            break;
          }
        }
      }

      if (provinceCode && cityCode && countryCode) {
        this.addressForm.areaCode = [provinceCode, cityCode, countryCode];
      }
      else {
        this.addressForm.areaCode = [];
        this.$vux.toast.text("找不到所选区域的行政编码！请联系客服处理，电话：400 1617 400！", "default");
      }
    },
    // 检索关键字
    mapLocalSearch(keyword) {
      let _this = this;
      _this.searchList = [];
      let options = {
        onSearchComplete: function(data){
          if(data != undefined){
            // 判断状态是否正确
            _this.isSearching = false;
            if (local.getStatus() == BMAP_STATUS_SUCCESS){
              if (data && data.Ar.length > 0) {
                _this.isShowSearchValue = true;
                // _this.isShowFooter = false;
                _this.searchList = data.Ar;
              }
              else {
                _this.$vux.toast.text("未检索到位置信息！", "default");
                _this.searchList = [];
                _this.isShowSearchValue = false;
                _this.isShowFooter = true;
              }
              _this.$forceUpdate();
            }
            else {
              _this.isShowSearchValue = false;
              _this.isShowFooter = true;
              _this.$vux.toast.text("检索位置失败！", "default");
              _this.$forceUpdate();
            }
          }
        }
      };
      let local = new BMap.LocalSearch(this.bMap, options);
      local.search(keyword);
    },
    onCellClick(point) {
      this.getLocation(point);
      this.isSearching = false;
      this.isShowSearchValue = false;
      this.isShowFooter = true;
      this.$forceUpdate();
      
      let _this = this;
      setTimeout(()=>{
        _this.addressForm.center = point;
        _this.center = point;
        // 重设地图中心点
        _this.bMap.centerAndZoom(point, _this.zoom);
        _this.drawCircle();
        _this.drawMarker();
      },500);
    
      // 监听地图拖拽事件
      this.bMap.addEventListener('ondragend',function() {
        setTimeout(()=>{
          _this.isShowSearchValue = false;
          _this.isShowFooter = true;
           _this.$forceUpdate();
          let point = _this.bMap.getCenter();
          _this.addressForm.center = point;
          _this.drawCircle();
          _this.drawMarker();
          _this.getLocation(point);
        },100)
      })
    },
    onBtnOk() {
      if(this.addressForm.additionalRemark.length == 0){
        this.$vux.toast.text("地址名称不能为空");
        return ;
      }
      this.$vux.loading.show("操作中");
      this.$commonService
      .post(this.userAction == 'add' ? "/area/addArea" : '/area/updateAreaById', {
        inAreaDto: {
          areaName: this.addressForm.additionalRemark,
          areaPoints: "",
          areaType: 3,
          centerLat: this.addressForm.center.lat,
          centerLng: this.addressForm.center.lng,
          city: this.addressForm.areaCode[1],
          county: this.addressForm.areaCode[2],
          centerAddress: this.addressForm.addressDetail,
          // 公司纳税号
          deptTaxNumber: "",
          description: this.addressForm.addressDetail,
          graphType: 1,
          province: this.addressForm.areaCode[0],
          radius: this.addressForm.radius,
          areaId: this.addressForm.areaId,
        }
      })
      .then(res => {
        if(!res.success){
          this.$vux.loading.hide();
          this.$vux.toast.text(res.msg);
          return;
        }
        this.dialogShow = false;
        this.$vux.toast.text(this.userAction == 'add' ? "新增成功！" : '修改成功！');
        this.$vux.loading.hide();
        this.keyword = "";
        this.visible = false;
        // this.getEstimateDistance();
        // this.$emit('on-change', this.addressForm);
        this.$router.replace({
          path: '/mapH5/addressManage',
        });
      })
      .catch(err => {
        this.$vux.loading.hide();
        this.$vux.toast.text(`操作出现未知错误！`);
      });
    },
  },
  watch: {
    radius(newVal) {
      this.addressForm.radius = newVal;
      this.drawCircle();
      this.drawMarker();
    },
    keyword(newVal) {
      if(newVal != ""){
        this.isSearching = true;
      }
      // this.isShowFooter = false;
      this.mapLocalSearch(newVal);
    }
  },
  mounted() {
    this.initBaiduMap(this.center, this.zoom);
    if(this.$route.query.data){
      this.userAction = 'editor',
      this.init(JSON.parse(this.$route.query.data), JSON.parse(this.$route.query.center));
    }
  }
}
</script>
