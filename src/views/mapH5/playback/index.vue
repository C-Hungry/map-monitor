<style lang="less" scoped>
  @import './index.less';
</style>

<template>
  <div id="dispatchBackplayMap">
    <Spin style="z-index: 30;" v-if="loading" fix size="large"></Spin>
    <!-- <div class="content-left" :style="{left: isShowContentleft ? '0px' : '-360px'}">
      <div style="padding: 20px;">
        <Select clearable filterable v-model="simId" size="large">
          <Option v-for="(item, index) in carNumberList" :value="item.gpsId" :key="index">{{item.truckNo}}</Option>
        </Select>
        <DatePicker 
          :value="datePickerValue" 
          type="datetimerange" 
          size="large" 
          format="yyyy-MM-dd HH:mm" 
          @on-change="onDatePickerChange"
          placement="bottom-start" 
          placeholder="起止日期" 
          style="width: 100%;margin-top:10px;">
        </DatePicker>
        <Button type="primary" icon="ios-search" size="large" style="width: 100%;margin-top:10px;" @click="search">查询</Button>
        <div style="font-size: 20px;fint-weight: 600;margin: 10px 0">GPS信息：</div>
        <Table 
          border 
          size="small"
          :columns="columns" 
          :data="tableData" 
          ></Table>
        <br>
        <div style="position: relative;">
          <Page 
            :total="totalCount"
            show-total 
            size="small"
            :page-size="pageSize"
            :current="currentPage" 
            @on-change="onPageChanged"
            @on-page-size-change="onPageSizeChanged"
            ></Page>
        </div>
      </div>
      <div class="content-left-toogle" @click="isShowContentleft=!isShowContentleft">
        <Icon :size="18" style="margin-top: 20px;" :type="isShowContentleft ? 'ios-arrow-back' : 'ios-arrow-forward'" />
      </div>
    </div> -->
    <!-- <div class="content-right" :style="{left: isShowContentleft ? '360px' : '0px'}"> -->
      <div class="content-right-top">
        <!-- <div class="search-bar">
          <Select v-model="mapUseType" size="large" style="width:70px;margin-left:8px;box-shadow: 3px 3px 3px #666;">
            <Option value="bmap" :key="1">百度</Option>
            <Option value="gmap" :key="2">谷歌</Option>
          </Select>
          <Button 
            @click="changeMapUseType"
            style="background-color: #fff;margin-left:-3px;box-shadow: 3px 3px 3px #666;" 
            type="ghost" 
            :icon="mapUseType == 'NORMAL_MAP' ? 'social-buffer' : 'planet'"
            size="large">{{mapUseType == 'NORMAL_MAP' ? '平面图' : '卫星图'}}</Button>
        </div> -->
      </div>
      <zkBMapPlayback
        v-if="mapUseType=='bmap'"
        ref="zkMapPlaybackH5"
        :center="center" 
        :zoom="zoom"
        :mapType="mapType"
        :allPoints="allPoints"
        @onAfterCenterAndZoom="saveCenterAndZoom"
        @onMapReady="onMapReady"
      ></zkBMapPlayback>
      <!-- <zkGMapMonitor
        v-if="mapUseType=='gmap'"
        ref="zkMapPlayback"
        :center="center" 
        :zoom="zoom"
        :mapType="mapType"
        :allPoints="allPoints"
        @onAfterCenterAndZoom="saveCenterAndZoom"
        @onMapReady="initWebSocket"
      ></zkGMapMonitor> -->
    <!-- </div> -->
  </div>
</template>

<script>
import vm from './index.js';
export default vm;
</script>