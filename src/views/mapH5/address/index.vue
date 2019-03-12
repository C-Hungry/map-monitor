<style lang="less" scoped>
#addressPage{
  background: rgb(239, 239, 244);
  .pageHeader{
    font-size: 12px;
    
    border-top: 12px solid rgb(239, 239, 244);
    margin: 0px 16px 0 16px;
    position: relative;
    input{
      outline: none;
      border: solid 1px #eee;
      height: 28px;
      width: 100%;
      padding-left: 10px;
      border-radius: 6px;
    }
    span{
      display: inline-block;
      text-align: center;
      width: 60px;
      height: 27px;
      line-height: 27px;
      color: white;
      background-color: #28acf7;
      border-radius: 5px;
      position: absolute;
      right: 0;
      top: 1px;
    }
    img{
      width: 12px;
      // padding: 5px;
      position: absolute;
      right: 5%;
      top: 8px;
    }
  }
  .pageMessageBox{
    border-radius: 6px;
    letter-spacing: -1px;
    font-weight: 600;
    font-size: 14px;
    margin: 12px 16px 0 16px;
    background: white;
    overflow: hidden;
    .AddressMessage{
      margin: 19px 18px 18px 24px;
      position: relative;
      .imgBox{
        position: absolute;
        right: 10px;
        top: 0px;
        img{
          display: inline-block;
          vertical-align: middle;
          width: 14px;
          margin-left: 20px;
        }
      }
    }
    p{
      margin-top: 12px;
    }
  }
  .btn{
    position: fixed;
    bottom: 0;
    background-color: #28b8f7;
    width:100%;
    text-align: center;
    height: 40px;
    line-height: 40px;
    color: white;
    font-size: 16px;
  }
}
.dialog{
  margin: 0 60px;
  border-radius: 6px;
  .msgBox{
    p{
      margin: 60px 50px 50px 50px;
      font-size: 16px;
      color: #444444;
    }
    div{
      margin-bottom: 28px;
      span{
        display: inline-block;
      }
      .dialogOkBtn{
        background-color: #28acf7;
        border-radius: 6px;
        color: white;
        padding: 9px 27px;
        border: solid 1px rgba(40, 172, 247, 0.6);
      }
      .dialogCancelBtn{
        padding: 9px 27px;
        color: #28acf7;
        border: solid 1px rgba(40, 172, 247, 0.6);
        border-radius: 6px;
        margin-left: 40px;
      }
    }
  }
}
</style>

<template>
  <div id="addressPage">
    <div class="pageHeader">
      <input v-model="searchValue" type="text" placeholder="请输入输入地址查询">
      <img @click="deleteSearchBtn()" src="../../../assets/deleteIconGrey.png" alt="">
    </div>
    <zk-list-view ref="zkListView" :query="getAddressMsg" top="40px">
      <template slot-scope="scope">
        <div class="pageMessageBox">
          <div class="AddressMessage">
            <span style="font-size: 14px;">{{ scope.row.areaName || '--'}}</span>
            <p style="font-size: 12px; color: #999999;">
              {{ scope.row.description || '--'}}
            </p>
            <div class="imgBox">
              <img @click="settingAddress(scope.row)" src="../../../assets/settingIcon.png" alt="">
              <img @click="deleteAddress(scope.row)" src="../../../assets/deleteIcon.png" alt="">
            </div>
          </div>
        </div>
      </template>
    </zk-list-view>
    <div class="btn" @click="$router.push('/mapH5/addressManageMap')">
      新&nbsp;&nbsp;&nbsp;增
    </div>
    <div v-transfer-dom>
      <x-dialog v-model="dialogShow" class="dialog">
        <div class="msgBox">
          <p>是否删除此地址?</br><span>({{ areaName }})</span></p>
          <div>
            <span @click="deleteAddressBtn()" class="dialogOkBtn">删除</span>
            <span @click="dialogShow = !dialogShow" class="dialogCancelBtn">取消</span>
          </div>
        </div>
      </x-dialog>
    </div>
    <!-- 新增地址地图弹框 -->
    <!-- <map-position addressForm="settingMsg" @on-change="onMapPositionChange" @on-estimate="onEstimateDistance" ref="mapPosition"></map-position> -->
  </div>
</template>

<script>
import zkListView from "../../../components/zk-list-view.vue";
import mapPosition from "../../../components/map-position.vue";
import {TransferDom, XDialog} from 'vux';
import { setTimeout } from 'timers';
export default {
  directives: {
    TransferDom,
  },
  components: {
    zkListView,
    XDialog,
    mapPosition,
  },
  data() {
    return {
      dialogShow: false,
      searchValue: '',
      deleteAddressId: '',
      areaName: '',
      formData: {
        receiverCity: "", // 收货地城市 
        receiverCounty: "", // 收货地城区
        receiverLocalDesc: "", // 收货地详细地址
        receiverProvince: "", // 收货地省份
        getCenter: '{}',  // 收货点中心坐标
        consignerCenterLat: "", // 发货地区域中心经度
        consignerCenterLng: "", // 发货地区域中心纬度
        receiverAreaPoints: '[]', // 收货地区域经纬度点集合 
        receiverRadius : 200, // 收货地半径
        getAdditionalRemark: '',
        consignerCity: "", // 发送地城市
        consignerCounty: "", // 发送地城区
        consignerLocalDesc: "", // 发货详细地址 
        consignerProvince : "", // 发货地省份
        sendCenter: '{}', // 发货点中心坐标
        receiverCenterLat: "", // 收货地区域中心经度
        receiverCenterLng: "", // 收货地区域中心纬度
        consignerAreaPoints : '[]', // 发货地区域经纬度点集合 
        consignerRadius: 200, // 发货地半径
        id: 0,
      },
      settingMsg: null,
    };
  },
  methods: {
    deleteAddress(data){
      this.dialogShow = true;
      this.deleteAddressId = data.areaId;
      this.areaName = data.areaName;
    },
    //查询用户
    searchAddress(){
      this.$refs["zkListView"].reload();
    },
    //获取用户信息
    getAddressMsg(pageSize, pageIndex, resolve, reject){
      this.$vux.loading.show("加载中");
      this.$commonService
      .get("/area/selectArea", {
        areaType: 0,
        currentPage: pageIndex + 1,
        pageSize: pageSize ,
        keywords: this.searchValue,
      })
      .then(res => {
        console.log(res);
        if(!res.success){
          this.$vux.loading.hide();
          this.$vux.toast.text(res.msg);
          return;
        }
        resolve({
          totalCount: res.total,
          rows: res.data
        });
        this.$vux.loading.hide();
      })
      .catch(err => {
        this.$vux.loading.hide();
        this.$vux.toast.text(`获取位置列表出现未知错误！`);
      });
    },
    //清除搜索条件按钮
    deleteSearchBtn(){
      this.searchValue = null;
      this.$refs["zkListView"].reload();
    },
    // 确定删除地址按钮
    deleteAddressBtn(){
      this.dialogShow = false;
      this.$vux.loading.show("操作中");
      this.$commonService
      .get("/area/deleteArea", {
        areaId: this.deleteAddressId,
      })
      .then(res => {
        this.$vux.loading.hide();
        if(!res.success){
          this.$vux.toast.text(res.msg);
          this.dialogShow = true;
          return;
        }
        this.$vux.toast.text("删除位置信息成功！");
        this.$refs["zkListView"].reload();
      })
      .catch(err => {
        this.$vux.loading.hide();
        this.$vux.toast.text(`删除位置信息出现未知错误！`);
      });
    },
    // 编辑地址按钮
    settingAddress(data){
      this.settingMsg = data;
      let center = {
        lng: this.settingMsg.centerLng,
        lat: this.settingMsg.centerLat,
      }
      this.$router.push({
        path: '/mapH5/addressManageMap',
        query: {
          data: JSON.stringify(this.settingMsg),
          center: JSON.stringify(center),
        }
      })
      // this.$refs.mapPosition.init(this.settingMsg, center);
    },
    // 新增地址
    addAddress(type){
      /** 
       * data: 回填值，用于信息回填（发货地or收货地）
       * center： 发货地或者收货地中心点，用于计算预估距离
      */
      let data = {};
      let center = {};
        data = {
          type: "sendPlace", // 选择地址的类型 
          areaCode: [this.formData.consignerProvince, this.formData.consignerCity, this.formData.consignerCounty], // 行政编号code
          addressDetail: this.formData.consignerLocalDesc, // 街道详情地址
          additionalRemark: this.formData.consignerDescription, // 补充说明
          center: this.formData.sendCenter,// 坐标中心点
          radius: this.formData.consignerRadius, // 采用点绘制时的半径（米）
          polygonPath: this.formData.consignerAreaPoints
        }
        center = this.formData.getCenter;
        this.$router.push({
          path: '/mapH5/addressManageMap',
          query: {
            data: JSON.stringify(data),
            center: JSON.stringify(center),
          }
        })
      // this.$refs.mapPosition.init(data, center);
    },
    onMapPositionChange(data) {
      this.$refs["zkListView"].reload();
      // 解决因地图弹出导致表单向上偏移问题
      document.getElementById('addressPage').scrollTo(0,0);
      this.$forceUpdate();
    },
    // 获取预估距离 
    onEstimateDistance(data) {
      this.formData.distance = (data / 1000).toFixed(2); 
    },
  },
  mounted() {
  },
  watch:{
    searchValue(newVal, oldVal){
      if(newVal != oldVal){
        this.$refs["zkListView"].reload();
      }
    }
  }
};
</script>