<style lang="less" scoped>
  @import './index.less';
</style>

<template>
  <div id="dispatchBackplayMap">
    <Spin style="z-index: 30;" v-if="loading" fix size="large"></Spin>
    <div class="content-left" :style="{right: isShowContentleft ? '360px' : '0px'}">
      <div class="content-left-top">
        <div class="search-bar">
          <Select v-model="mapUseType" size="large" style="width:70px;margin-left:8px;box-shadow: 3px 3px 3px #666;">
            <Option value="bmap" :key="1">百度</Option>
            <Option value="gmap" :key="2">谷歌</Option>
          </Select>
          <Button 
            @click="changeMapUseType"
            style="background-color: #fff;margin-left:-3px;box-shadow: 3px 3px 3px #666;" 
            type="ghost" 
            :icon="mapType == 'NORMAL_MAP' ? 'social-buffer' : 'planet'"
            size="large">{{mapType == 'NORMAL_MAP' ? '平面图' : '卫星图'}}</Button>
        </div>
      </div>
      <zkBMapArea
        v-if="mapUseType=='bmap'"
        ref="zkMapArea"
        :center="center" 
        :zoom="zoom"
        :mapType="mapType"
        @onDrawComplete="onDrawComplete"
        @onAfterCenterAndZoom="saveCenterAndZoom"
        @onMapReady="onMapReady"
      ></zkBMapArea>
      <zkGMapArea
        v-if="mapUseType=='gmap'"
        ref="zkMapArea"
        :center="center" 
        :zoom="zoom"
        :mapType="mapType"
        @onDrawComplete="onDrawComplete"
        @onAfterCenterAndZoom="saveCenterAndZoom"
        @onMapReady="onMapReady"
      ></zkGMapArea>
    </div>
    <div class="content-right" :style="{right: isShowContentleft ? '0px' : '-360px'}">
      <br>
      <div style="font-size: 16px;font-weight: 600;padding: 16px 8px;">
        位置查询：
      </div>
      <div style="padding: 0 8px;">
        <Input v-model="address" placeholder="请输入位置" style="width: 236px" />
        <Button type="primary" icon="ios-search" @click="search">查询</Button>
      </div>
      <br>
      <br>
      <div style="font-size: 16px;font-weight: 600;padding: 16px 8px;">
        新增区域：
      </div>
      <Form :label-width="100" ref="formData" :model="formData" :rules="formDataRules">
        <FormItem label="区域名称：" prop="areaName">
          <Input v-model="formData.areaName" :disabled="!!$route.query.areaId" style="width: 220px" placeholder="请输入区域名称"></Input>
        </FormItem>
        <FormItem label="区域描述：" prop="description">
          <Input v-model="formData.description" style="width: 220px" placeholder="请输入区域描述"></Input> 
        </FormItem>
        <FormItem label="区域形状：" prop="graphType">
          <RadioGroup v-model.number="formData.graphType">
            <Radio :label="1">
              <span>圆形</span>
            </Radio>
            <Radio :label="2">
              <span>矩形</span>
            </Radio>
            <Radio :label="3">
              <span>多边形</span>
            </Radio>
          </RadioGroup>
        </FormItem>
        <FormItem v-show="formData.graphType==1" label="区域半径：" prop="radius">
          <Row>
            <Col span="15">
              <Slider :min="100" :max="5000" v-model="formData.radius" style="width: 135px"></Slider>
            </Col>
            <Col span="9">
              <Input v-model.number="formData.radius" style="width: 75px">
                <Button slot="append" style="padding: 6px 6px;">米</Button>
              </Input>
            </Col>
          </Row>
        </FormItem>
        <FormItem label="地理位置：" prop="centerAddress">
          <Input v-model="formData.centerAddress" style="width: 220px" placeholder="请绘制区域"></Input>
        </FormItem>
        <FormItem label="中心经度：" prop="centerLng">
          <Input v-model.number="formData.centerLng" style="width: 220px" disabled placeholder="请绘制区域"></Input>
        </FormItem>
        <FormItem label="中心纬度：" prop="centerLat">
          <Input v-model.number="formData.centerLat" style="width: 220px" disabled placeholder="请绘制区域"></Input>
        </FormItem>
      </Form>
      <div>
        <Button style="margin: 0 2px 0 8px;" type="primary" icon="edit" @click="draw">绘制</Button>
        <Button style="margin: 0 2px 0 2px;" type="warning" icon="refresh" @click="redraw">重绘</Button>
        <Button style="margin: 0 2px 0 2px;" type="error" icon="trash-a" @click="reset">清空</Button>
        <Button v-if="!$route.query.areaId" style="margin: 0 2px 0 2px;" type="success" icon="checkmark-round" :disabled="loading" :loading="loading" @click="confirm">保存</Button>
        <Button v-if="!!$route.query.areaId" style="margin: 0 2px 0 2px;" type="success" icon="checkmark-round" :disabled="loading" :loading="loading" @click="edit">更新</Button>
      </div>
      <div class="content-right-toogle" @click="isShowContentleft=!isShowContentleft">
        <Icon :size="18" style="margin-top: 20px;" :type="isShowContentleft ? 'ios-arrow-forward' : 'ios-arrow-back'" />
      </div>
    </div>
  </div>
</template>

<script>
import vm from './index.js';
export default vm;
</script>