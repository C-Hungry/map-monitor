<style lang="less" scoped>

</style>

<template>
  <div>
    <Spin v-if="loading" fix>{{isFailed ? '访问地图服务器失败，请刷新页面重试...' : '权限验证中...'}}</Spin>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: false,
      isFailed: false,
      appkey: "",
      signature: "",
      time: "",
      type: "",
      startTime: "",
      endTime: "",
      truckNo: "",
      notNeedCenter: ['addressManageH5','addressManageMapH5']
    }
  },
  methods: {
    // 获取token
    getAssessToken() {
      this.loading = true;
      this.isFailed = false;
      this.$commonService
      .get("/verify/isAccessRequestMap", {
        appkey: this.appkey,
        signature: this.signature,
        time: this.time
      })
      .then(res => {
        if(!res.success){
          this.isFailed = true;
          this.$Message.error(res.msg);
          return;
        }

        if (res.data) {
          this.$storage.saveToken(res.data);
          // 不需要中心点数组存在this.type取getCorpCenterH5()方法,否则取getCorpCenter()
          this.notNeedCenter.indexOf(this.type) == -1 ? this.getCorpCenter() : this.getCorpCenterH5();
          this.getCascaderAddress();
        } else {
          this.$Message.error('assess-token获取失败')
        }
      })
      .catch(error => {
        this.loading = false;
        this.isFailed = true;
        error.msg && this.$Message.error(error.msg);
      })
    },
    // 获取当前公司区域的中心点
    getCorpCenter() {
      this.$commonService
      .get("/dept/getLocationByCompanyTaxNumber", {})
      .then(res => {
        this.loading = false;
        if(!res.success){
          this.isFailed = true;
          this.$Message.error(res.msg);
          return;
        }

        if (res.data) {
          // 保存公司中心点
          let lngLat = res.data.split(',');
          this.$storage.saveCorpCenter({
            lng: parseFloat(lngLat[0]),
            lat: parseFloat(lngLat[1])
          });

          if (this.type == "truckMonitor") {
            this.$router.push('/map/truckMonitor');
          } 
          else if (this.type == "taskMonitor") {
            this.$router.push('/map/taskMonitor');
          } 
          else if (this.type == "playback") {
            // 轨迹回放需要传递三个参数
            this.$router.push({
              path: "/map/playback",
              query: {
                truckNo: this.truckNo,
                startTime: this.startTime,
                endTime: this.endTime
              }
            });
          } 
          else if (this.type == "areaManage") {
            this.$router.push('/map/areaManage');
          } 
          else if (this.type == "routeManage") {
            this.$router.push('/map/routeManage');
          } 
          else if (this.type == "truckMonitorH5") {
            this.$router.push('/mapH5/truckMonitor');
          } 
          else if (this.type == "taskMonitorH5") {
            this.$router.push('/mapH5/taskMonitorH5');
          } 
          else if (this.type == "playbackH5") {
            this.$router.push('/mapH5/playback');
          } 
          else if (this.type == "addressManageH5") {
            this.$router.push('/mapH5/addressManage');
          } 
          else if (this.type == "addressManageMapH5") {
            this.$router.push('/mapH5/addressManageMap');
          } 
          else {
            this.$Message.error('跳转的地图类型配置不正确')
          }

        } else {
          this.$Message.error('公司地址坐标获取失败')
        }
      })
      .catch(error => {
        this.loading = false;
        this.isFailed = true;
        error.msg && this.$Message.error(error.msg);
      })
    },
    getCorpCenterH5(){
     if (this.type == "addressManageH5") {
        this.$router.push('/mapH5/addressManage');
      } 
      else if (this.type == "addressManageMapH5") {
        this.$router.push('/mapH5/addressManageMap');
      } 
      else {
        this.$Message.error('跳转的地图类型配置不正确')
      }
    },
    // 获取省市区级联数据
    getCascaderAddress() {
      this.$commonService
      .get("/area/getAllArea", {})
      .then(res => {
        if(!res.success){
          this.$Message.error(res.msg);
          return;
        }
        if (res.data) {
          this.$storage.saveCascaderAddress(res.data);
        } else {
          this.$Message.error('assess-token获取失败')
        }
      })
      .catch(error => {
        this.loading = false;
        error.msg && this.$Message.error(error.msg);
      })
    },
  },
  mounted() {
    this.appkey = this.$route.query.appkey;
    this.signature = this.$route.query.signature;
    this.time = this.$route.query.time;
    this.type = this.$route.query.type;

    this.startTime = this.$route.query.startTime;
    this.endTime = this.$route.query.endTime;
    this.truckNo = this.$route.query.truckNo;
    
    if (this.appkey && this.signature && this.time) {
      // 保存用户信息
      this.$storage.saveUserInfo({
        appkey: this.appkey,
        signature: this.signature,
        time: this.time 
      })
      this.getAssessToken();
    }

  }
}
</script>