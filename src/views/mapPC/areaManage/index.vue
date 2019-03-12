<style lang="less" scoped>

</style>

<template>
  <div>
    <div class="zk-search-bar">
      <div class="zk-search-bar-container">
        <div class="zk-search-bar-row"> 
          <span>关键字：</span>
          <Input placeholder="区域名称" v-model="keywords" clearable style="width: 184px;" />&#x3000;
          <!-- <span>区域类型：</span>
          <Select style="width: 184px;text-align: left;" v-model="areaType" filterable placeholder="区域类型">           
            <Option v-for="item in areaTypeList" :value="item.value" :key="item.value">{{ item.label }}</Option>
          </Select>&#x3000; -->
          <Button type="primary" icon="ios-search"  @click="query" :loading="loading">查询</Button>          
          <Button type="warning" icon="plus-round"  @click="edit()">新增</Button>         
        </div>        
      </div>
    </div>
    <Table border :columns="columns" :data="rows" :loading="loading"></Table>
    <br>
    <div style="position: relative;">
      <Page 
      :total="totalCount" 
      show-elevator 
      show-total 
      show-sizer
      :page-size="pageSize"
      :page-size-opts="[10, 20, 50]"
      :current="currentPage" 
      @on-change="onPageChanged"
      @on-page-size-change="onPageSizeChanged"
      ></Page>
    </div>
  </div>
</template>

<script>
export default {
    data() {
      return {
        loading:false,
        keywords:"",
        currentPage: 1,
        pageSize: 10,
        totalCount: 0,
        areaType: 0, // 1.收货区域，2.发货区域 0全部
        graphTypeList: ['圆形', '矩形', '多边形'],
        columns:[
          {
            title:'区域名称',
            key:'areaName',
            minWidth: 120,
          },
          {
            title:'描述',
            key:'description',
            minWidth: 120
          },
          {
            title:'区域图形',
            key:'graphType',            
            minWidth: 85,
            render: (h, params) => { 
              return h("span", this.graphTypeList[params.row.graphType - 1]);
            }
          },
          {
            title:'中心点经纬度',
            key:'centerLat',
            minWidth: 155,
            render: (h, params) => { 
              return h("span", `${params.row.centerLng && params.row.centerLng.toFixed(6)}，${params.row.centerLat && params.row.centerLat.toFixed(6)}`);
            }
          },
          {
            title:'中心点位置',
            key:'centerAddress',
            minWidth: 160
          },
          {
            title: "操作",
            width: 120,
            align: 'center',
            fixed: "right",
            render: (h, params) => {
              return h("div", [
                h(
                  "Button",
                  {
                    props: {
                      type: "primary",
                      size: "small"
                    },
                    style: {
                      marginRight: "8px"
                    },
                    on: {
                      click: () => {
                        this.edit(params.row.areaId);
                      }
                    }
                  },
                  "修改"
                ),
                h(
                  "Button",
                  {
                    props: {
                      type: "error",
                      size: "small"
                    },
                    on: {
                      click: () => {
                        this.delete(params.row);
                      }
                    }
                  },
                  "删除"
                )
              ]);
            }
          },
        ],
        rows:[]

      };
    },
    methods:{
      //button查询
      query() {
        this.currentPage = 1;
        this.getAreaList();
      },
      // 分页
      onPageChanged(page){
        this.currentPage = page;
        this.getAreaList();
      },
      // 页码大小改变 分页
      onPageSizeChanged(size) {
        this.currentPage = 1;
        this.pageSize = size;
        this.getAreaList();
      },
      // 新增或者编辑区域
      edit(areaId) {
        let { href } = this.$router.resolve({
          path: '/map/areaEdit',
          query: {
            areaId: areaId
          }
        })
        window.open(href, '_blank')
      },
      // 删除
      delete(data){

        this.$Modal.confirm({
          title: '提示',
          content: `<p>确定<span style="color: red;font-size: 16px;"> 删除 </span>
                    区域名称为<span style="color: red;font-size: 16px;"> ${data.areaName} </span>的区域吗？</p>`,
          loading: true,
          onOk: () => {
            this.$commonService
              .get("/area/deleteArea", {
                areaId: data.areaId
              })
              .then(res => {
                this.$Modal.remove();
                if(!res.success){
                  this.$Message.error(res.msg);
                  return;
                }
                
                this.$Message.success("删除成功！");
                this.getAreaList();
              })
              .catch(err => {
                this.$Modal.remove();
                this.$Message.error("删除出现未知错误！");
              });
          }
        });
      },
      //请求表格中的数据
      getAreaList(){
        this.loading = true;
        this.$commonService
          .get("/area/selectArea", {
            "areaType": this.areaType,
            "keywords": this.keywords,
            "currentPage": this.currentPage,
            "pageSize":this.pageSize     
          })
          .then(res => {
            this.loading = false;
            if(!res.success){
              this.$Message.error(res.msg);
              return;
            }
            this.rows = res.data;
            this.totalCount = res.total;         
          })
          .catch(err => {
            this.loading = false;
            err.msg && this.$Message.error(err.msg);
          });
      },
      
    },
    mounted(){
      this.getAreaList();
    }
     
  }
</script>
