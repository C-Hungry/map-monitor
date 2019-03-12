<style lang="less" scoped>
</style>

<template>
  <div id="addressPage">
    <!-- 新增地址地图弹框 -->
    <map-position @on-change="onMapPositionChange" @on-estimate="onEstimateDistance" ref="mapPosition"></map-position>
  </div>
</template>

<script>
import mapPosition from "../../../components/map-position.vue";
import { setTimeout } from 'timers';
export default {
  components: {
    mapPosition,
  },
  data() {
    return {
    };
  },
  methods: {
    onMapPositionChange(data) {
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
  }
};
</script>