
<style scoped lang="less">
.list-view{
  background-color: inherit;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  .no-data,
  .data-failed {
    color: #757575;
    text-align: center;
    margin-top: 165px;
  }
  .rows{
    position: relative;
  }
}
</style>

<template>
  <div class="list-view" :style="{'top': top}">
    <scroller
      :on-refresh="onRefresh"
      :on-infinite="onInfinite"
      refresh-layer-color="#5cadff"
      :no-data-text="rows.length > 0 ? '没有更多数据' : ''"
      ref="custom-scroller">
   
      <svg class="spinner" style="fill: #28b8f7;" slot="refresh-spinner" viewBox="0 0 64 64">
        <g><circle cx="16" cy="32" stroke-width="0" r="3"><animate attributeName="fill-opacity" dur="750ms" values=".5;.6;.8;1;.8;.6;.5;.5" repeatCount="indefinite"></animate><animate attributeName="r" dur="750ms" values="3;3;4;5;6;5;4;3" repeatCount="indefinite"></animate></circle><circle cx="32" cy="32" stroke-width="0" r="3.09351"><animate attributeName="fill-opacity" dur="750ms" values=".5;.5;.6;.8;1;.8;.6;.5" repeatCount="indefinite"></animate><animate attributeName="r" dur="750ms" values="4;3;3;4;5;6;5;4" repeatCount="indefinite"></animate></circle><circle cx="48" cy="32" stroke-width="0" r="4.09351"><animate attributeName="fill-opacity" dur="750ms" values=".6;.5;.5;.6;.8;1;.8;.6" repeatCount="indefinite"></animate><animate attributeName="r" dur="750ms" values="5;4;3;3;4;5;6;5" repeatCount="indefinite"></animate></circle></g>
      </svg>

      <div class="rows">
        <div v-for="(item, index) in rows" :key="index">
          <slot :row="item" :$index="index"></slot>
        </div>
        <div class="data-failed" :style="{'margin-top': warnMarginTop}" v-if="isloadingFailed">
          <img style="width:70px;" src="../assets/load_fail.png" alt="" /><br />
          <span>加载失败</span><br />
        </div>
        <div class="no-data" :style="{'margin-top': warnMarginTop}" v-else-if="isNoData && !isloadingFailed">
          <img style="width:70px;" src="../assets/nodata.png" alt="" /><br />
          <span>暂无数据</span>
        </div>
      </div>
      
      <div slot="infinite-spinner" v-if="isInit || isloadingFailed || isNoData"></div>
      <svg v-else class="spinner" style="fill: #28b8f7;" slot="infinite-spinner" viewBox="0 0 64 64">
        <g><circle cx="16" cy="32" stroke-width="0" r="3"><animate attributeName="fill-opacity" dur="750ms" values=".5;.6;.8;1;.8;.6;.5;.5" repeatCount="indefinite"></animate><animate attributeName="r" dur="750ms" values="3;3;4;5;6;5;4;3" repeatCount="indefinite"></animate></circle><circle cx="32" cy="32" stroke-width="0" r="3.09351"><animate attributeName="fill-opacity" dur="750ms" values=".5;.5;.6;.8;1;.8;.6;.5" repeatCount="indefinite"></animate><animate attributeName="r" dur="750ms" values="4;3;3;4;5;6;5;4" repeatCount="indefinite"></animate></circle><circle cx="48" cy="32" stroke-width="0" r="4.09351"><animate attributeName="fill-opacity" dur="750ms" values=".6;.5;.5;.6;.8;1;.8;.6" repeatCount="indefinite"></animate><animate attributeName="r" dur="750ms" values="5;4;3;3;4;5;6;5" repeatCount="indefinite"></animate></circle></g>
      </svg>
    
    </scroller>
  </div>
</template>

<script>
export default {
  name: "zk-list-view",
  props: {
    top: {
      type: String,
      default: "0px"
    },
    warnMarginTop: {
      type: String,
      default: "165px"
    },
    query: {
      type: Function,
      default: function(pageSize, pageIndex, resolve, reject) { setTimeout(()=>{resolve([]);}, 1000) }
    }
  },
  data() {
    return {
      pageIndex: 0,
      pageSize: 0,
      totalCount: 10,
      rows: [],
      isInit: true,
      isloadingFailed: false,
      isNoData: false,
      timeoutId: 0
    };
  },
  methods: {
    // 初始化
    init(){
      this.isInit = true;
      this.$vux.loading.show({text: '加载中...'});
    },
    // 下拉刷新
    onRefresh(done) {
      this.pageSize = 10;
      this._loadData(done);
    },
    // 上拉加载
    onInfinite(done) {
      this.pageSize += 10;
      this._loadData(done);
    },
    // 重新加载数据
    reload() {
      this.isInit = true;
      this.$vux.loading.show({text: '加载中...'});
      this.$refs['custom-scroller'].onRefresh();
    },
    // 加载数据
    _loadData(done) {
      this.query(this.pageSize,this.pageIndex,(res) => {
        this.isInit = false;
        this.rows = res.rows;
        this.totalCount = res.totalCount;
        this.isNoData = this.totalCount == 0;
        this.isloadingFailed = false;
        if(done) {
          res.rows.length == res.totalCount ? done(true) : done();
        };
        if (res.isNeedGrabTime) {
          if(this.timeoutId) clearTimeout(this.timeoutId);
          this._createTimeout();
        }
      },()=>{
        this.isInit = false;
        this.isloadingFailed = true;
        if(done) done(true);
      });
    },
    // 计算抢单时间
    _createTimeout() {
      this.rows.forEach(row => {
        if(row.restTime <= 0){
          row.tick = "";
          return;
        }
        var days = parseInt(row.restTime / 60 / 60 / 24 , 10); //计算剩余的天数     
        var hours = parseInt(row.restTime / 60 / 60 % 24 , 10); //计算剩余的小时     
        var minutes = parseInt(row.restTime / 60 % 60, 10);//计算剩余的分钟
        var seconds = parseInt(row.restTime % 60, 10);//计算剩余的秒数

        row.restTime =  row.restTime - 1;
        
        row.tick = (days ? "<font color='#0E9AEC'>" + days + "</font>天" : "") +
          ((days || hours)? "<font color='#0E9AEC'>" + hours + "</font>小时" : "") + 
          ((days || hours || minutes) ? "<font color='#0E9AEC'>" + minutes + "</font>分钟" : "") +
          ((!minutes && seconds) ? "<font color='#0E9AEC'>" + seconds + "</font>秒" : '');
        
      });
      this.$forceUpdate();
      this.timeoutId = setTimeout(() => {
        this._createTimeout();
      }, 1000);
    },
  },
  mounted() {
    
  },
  beforeDestroy(){
    if(this.timeoutId) clearTimeout(this.timeoutId);
  }
};
</script>