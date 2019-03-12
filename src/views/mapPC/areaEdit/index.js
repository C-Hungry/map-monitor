import zkBMapArea from '../../../components/zkBMapArea.vue';
import zkGMapArea from '../../../components/zkGMapArea.vue';
export default {
  components: {
    zkBMapArea,
    zkGMapArea
  },
  data() {
    return {
      loading: false,
      mapUseType: "bmap", // 百度bmap 或者 谷歌gmap
      mapType: 'NORMAL_MAP', // 平面图NORMAL_MAP 或者 卫星图SATELLITE_MAP
      center: null,
      zoom: 13,
      isShowContentleft: true, // 是否显示左侧菜单
      isEdit: !!this.$route.query.areaId,

      address: "",

      formData: {
        "areaName": "",
        "areaPoints": "",
        "areaType": 3,
        "centerAddress": "",
        "centerLat": 0,
        "centerLng": 0,
        "city": "",
        "county": "",
        "deptTaxNumber": "",
        "description": "",
        "graphType": 1,
        "province": "",
        "radius": 100
      },

      formDataRules: {
        areaName: [
          { required: true, message: "区域名称不能为空", trigger: "change" },
        ],
        graphType: [
          { required: true, type: 'number', message: "区域形状不能为空", trigger: "change" },
        ],
        radius: [
          { required: true, type: 'number', message: "半径不能为空", trigger: "change" },
        ],
        centerAddress: [
          { required: true, message: "地理位置不能为空", trigger: "change" },
        ],
        centerLat: [
          {
            type: "method",
            required: true,
            validator: (rule, value, callback) => {
              if (value <=0 ) {
                callback(new Error("中心经度不能为空"));
              }
              else{
                callback();
              }
            },
            trigger: "change"
          }
        ],
        centerLng: [
          {
            type: "method",
            required: true,
            validator: (rule, value, callback) => {
              if (value <=0 ) {
                callback(new Error("中心经度不能为空"));
              }
              else{
                callback();
              }
            },
            trigger: "change"
          }
        ]
      },

      allPoints: [], // 所有坐标点集合
      carNumberList: [],
      iconGreen: require('../../../assets/position-green1.png')
    }
  },
  methods: {
    // 平面图与卫星图切换
    changeMapUseType() {
      this.mapType = this.mapType == 'NORMAL_MAP' ? 'SATELLITE_MAP' : 'NORMAL_MAP';
    },
    // map Ready事件
    onMapReady() {
      this.getAreaInfoById();
    },
    // 获取地图的绽放级别及中心点
    centerAndZoom(points) {
      let view = this.map.getViewport(points);
      this.map.centerAndZoom(new BMap.Point(view.center.lng, view.center.lat), view.zoom - 1);
    },
    // 保留center和zoom
    saveCenterAndZoom(center,zoom) {
      this.center = center;
      this.zoom = zoom;
    },
    // 搜索
    search() {
      this.$refs['zkMapArea'].drawPointByAddress(this.address);
    },
    // 开始绘制
    draw() {
      this.$refs['zkMapArea'].drawGraph(this.formData);
    },
    // 重新绘制
    redraw() {
      this.$refs['zkMapArea'].drawGraph(this.formData);
    },
    // 确认保存
    confirm() {

      this.$refs["formData"].validate(valid => {
        if (valid) {
          this.loading = true;
          let params = Object.assign({}, this.formData);
          if (params.graphType == 1) {
            params.areaPoints = '';
          } else {
            params.radius = 0
          }
          this.$commonService
            .post("/area/addArea", {
              dto: params
            })
            .then(res => {
              this.loading = false;
              if(!res.success){
                this.$Notice.error({
                  title: res.msg
                });
                return;
              }
              this.$Notice.success({
                title: '区域保存成功！'
              });
            })
            .catch(err => {
              this.loading = false;
              this.$Notice.error({
                title: '区域保存失败！'
              });
            });
        } 
      })

    },
    // 编辑确认
    edit() {
      this.$refs["formData"].validate(valid => {
        if (valid) {
          this.loading = true;
          let params = Object.assign({}, this.formData);
          if (params.graphType == 1) {
            params.areaPoints = '';
          } else {
            params.radius = 0;
          }

          this.$commonService
            .post("/area/updateAreaById", {
              dto: params
            })
            .then(res => {
              this.loading = false;
              if(!res.success){
                this.$Notice.error({
                  title: res.msg
                });
                return;
              }
              this.$Notice.success({
                title: '区域更新成功！'
              });
            })
            .catch(err => {
              this.loading = false;
              this.$Notice.error({
                title: '区域更新失败！'
              });
            });

        } 
      })
    },
    // 重置
    reset() {

      this.formData = {
        "areaName": "",
        "areaPoints": "",
        "areaType": 3,
        "centerAddress": "",
        "centerLat": 0,
        "centerLng": 0,
        "city": "",
        "county": "",
        "deptTaxNumber": "",
        "description": "",
        "graphType": 1,
        "province": "",
        "radius": 100
      }
      
      this.$refs['zkMapArea'].drawGraph(this.formData);
    },
    
    // 监听地图绘制完成
    onDrawComplete(data, type) {

      this.formData.centerAddress = data.address.address;
      this.formData.province = data.address.code[0];
      this.formData.city = data.address.code[1];
      this.formData.county = data.address.code[2];
      this.formData.centerLat = data.center.lat;
      this.formData.centerLng = data.center.lng;

      if(type=="circle") {
        this.formData.radius = Math.floor(data.radius);
      } 
      else if (type=="polygon" || type=="rect") {
        let points = [];
        data.points.forEach((item, index) => {
          points.push({
            Sequence: index + 1,
            Lat: item.lat,
            Lng: item.lng
          })
        })
        this.formData.radius = 0;
        this.formData.areaPoints = JSON.stringify(points);
      }
      else {

      }

    },
    // 获取区域详情
    getAreaInfoById() {
      let areaId = this.$route.query.areaId;
      if (areaId) {
        this.$commonService
        .get("/area/selectAreaById", {
          areaId: areaId
        })
        .then(res => {
          if(!res.success){
            this.$Notice.error({
              title: res.msg
            });
            return;
          }
          this.formData = Object.assign({}, res.data);
          
          this.$nextTick(()=> {
            this.$refs['zkMapArea'].backfill(this.formData);
            this.isEdit = false;
          })
        })
        .catch(err => {
          this.$Notice.error({
            title: err.msg
          });
        });
      }
    }
  },
  watch: {
    'formData.graphType'(newVal) {
      if (!this.isEdit) {
        this.formData.allPoints = "";
        this.formData.centerAddress = "";
        this.formData.centerLat = 0;
        this.formData.centerLng = 0;
        this.formData.radius = 100;
        this.formData.province = '';
        this.formData.city = '';
        this.formData.county = '';
      }
      this.draw();
    },
    'formData.radius'(newVal) {
      this.$refs['zkMapArea'].onRadiusChange(newVal);
    },
  },
  created() {

  },
  beforeDestroy() {
    
  }
}