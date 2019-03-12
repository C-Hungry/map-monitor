<style lang="less" scoped>
  @import './index.less';
</style>

<template>
  <div id="dispatchMonitorMap">
    <Spin v-if="loading" fix size="large" style="z-index: 30;"></Spin>
    <div class="search-bar">
      <Select v-model="searchType" size="large" style="width:70px;box-shadow: 3px 3px 3px #aaa;">
        <Option :value="1" :key="1">车辆</Option>
        <Option :value="2" :key="2">位置</Option>
      </Select>
      <Select v-show="searchType==1" clearable filterable @on-change="onTruckSelectChange" v-model="simId" size="large" style="width:120px;margin-left:-3px;box-shadow: 3px 3px 3px #aaa;">
        <Option v-for="(item, index) in allCarNumberList" :value="item.gpsId" :key="index">{{item.truckNo}}</Option>
      </Select>
      <Input v-show="searchType==2" v-model="position" @on-enter="onSearchPosition" size="large" placeholder="请输入" style="width:120px;margin-left:-3px;box-shadow: 3px 3px 3px #aaa;"/>
      <Select v-model="mapUseType" size="large" style="width:70px;margin-left:8px;box-shadow: 3px 3px 3px #aaa;">
        <Option value="bmap" :key="1">百度</Option>
        <Option value="gmap" :key="2">谷歌</Option>
      </Select>
      <Button 
        @click="changeMapType"
        style="background-color: #fff;margin-left:-3px;box-shadow: 3px 3px 3px #aaa;" 
        type="ghost" 
        :icon="mapType == 'NORMAL_MAP' ? 'social-buffer' : 'planet'"
        size="large">{{mapType == 'NORMAL_MAP' ? '平面图' : '卫星图'}}</Button>
    </div>
    <zkBMapMonitor
      v-if="mapUseType=='bmap'"
      ref="zkMapMonitor"
      :center="center" 
      :zoom="zoom"
      :mapType="mapType"
      :allPoints="allPoints"
      @onAfterCenterAndZoom="saveCenterAndZoom"
      @onMapReady="initWebSocket"
    ></zkBMapMonitor>
    <zkGMapMonitor
      v-if="mapUseType=='gmap'"
      ref="zkMapMonitor"
      :center="center" 
      :zoom="zoom"
      :mapType="mapType"
      :allPoints="allPoints"
      @onAfterCenterAndZoom="saveCenterAndZoom"
      @onMapReady="initWebSocket"
    ></zkGMapMonitor>
    <div class="map-footer">
      <div class="map-footer-tab">
        <Tag @click.native="getSimIdListByStatus('all')" type="dot" :style="{'background-color': tagStatus == 'all' ? '#B5E2FF!important': ''}" color="blue">全部：{{statistic.total}}</Tag>
        <Tag @click.native="getSimIdListByStatus('running')" type="dot" :style="{'background-color': tagStatus == 'running' ? '#B5E2FF!important': ''}" color="green">运行中：{{statistic.running}}</Tag>
        <Tag @click.native="getSimIdListByStatus('parking')" type="dot" :style="{'background-color': tagStatus == 'parking' ? '#B5E2FF!important': ''}" color="red">停车：{{statistic.parking}}</Tag>
        <Tag @click.native="getSimIdListByStatus('offline')" type="dot" :style="{'background-color': tagStatus == 'offline' ? '#B5E2FF!important': ''}" color="yellow">离线：{{statistic.offline}}</Tag>
        <Tag @click.native="getSimIdListByStatus('lost')" checkable type="dot" :style="{'background-color': tagStatus == 'lost' ? '#B5E2FF!important': ''}" color="grey">未定位：{{statistic.lost}}</Tag>
        <Icon v-if="isShowTable" @click="showTable" type="chevron-up" :size="16" style="float: right;margin: 16px 8px 0 8px;cursor: pointer"></Icon>
        <Icon v-else @click="showTable" type="chevron-down" :size="16" style="float: right;margin: 16px 8px 0 8px;cursor: pointer"></Icon>
        <!-- <Button ref="myMapRefresh" type="primary" size="small" shape="circle" :loading="refreshTime == 0" style="float: right;margin: 14px 8px 0 8px;">{{refreshTime > 0 ? refreshTime + ' 秒后刷新车辆列表' : '正在刷新车辆列表'}}</Button> -->
      </div>
      <div class="map-footer-table" v-if="isShowTable">
        <Table 
          border 
          :columns="columns" 
          highlight-row 
          size="small" 
          height="216" 
          :data="tableData" 
          :loading="tableLoading"
          @on-row-click="onRowClick">
        </Table>
        <div style="position: relative;padding: 0 8px;margin-top: 10px;">
          <Page 
          :total="totalCount" 
          show-elevator 
          show-total 
          show-sizer
          size="small"
          :page-size="pageSize"
          :page-size-opts="[5, 20, 50]"
          :current="currentPage" 
          @on-change="onPageChanged"
          @on-page-size-change="onPageSizeChanged"
          ></Page>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import vm from './index.js';
export default vm;
</script>