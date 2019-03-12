<style scoped lang="less">
  .login {
    background-image: url(../../assets/login-bg.jpg);
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: bottom center;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    .login-form {
      margin: 0;
      padding: 0 !important;
      border: 0;
      width: 480px;
      height: 360px;
      padding: 10px;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: solid 1px #ddd;
      border-radius: 10px;
      background-color: rgba(255, 255, 255, 0.1);
      .login-form-area {
        position: absolute;
        top: 10px;
        bottom: 10px;
        left: 10px;
        right: 10px;
        border-radius: 8px;
        background-color: #e8f2f9;
        .login-title {
          display: block;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 5px 5px 0 0;
          height: 100px;
          color: #084489;
          font-size: 26px;
          line-height: 100px;
          text-align: center;
          img {
            width: 200px;
            margin-top: 30px;
          }
        }
        .login-content {
          position: absolute;
          top: 100px;
          bottom: 0;
          left: 0;
          right: 0;
          margin: 0 64px;
        }
      }
    }
    .footer {
      position: absolute;
      bottom: 60px;
      left: 50%;
      transform: translate(-50%, 0);
      color: #666;
      font-size: 13px;
      line-height: 25px;
      text-align: center;
    }
    .download-app {
      user-select: none;
      position: fixed;
      top: 40px;
      right: 40px;
      color: #ffffff;
      font-size: 16px;
      img {
        width: 32px;
        vertical-align: middle;
      }
    }
    .download-app:hover {
      cursor: pointer;
    }
  }
</style>

<style lang="less">
  .qr-modal {
    .ivu-modal-footer {
      border: none;
    }
  }
</style>

<template>
  <div class="login">
    <div class="footer">
      陕西中矿科技有限公司&nbsp;&nbsp;提供技术支持
    </div>
    <div class="login-form">
      <div class="login-form-area">
        <div class="login-title">
          <Icon :size="40" type="earth" style="vertical-align: middle;"></Icon>
          <span style="display: inline-block;margin-left: 10px;font-size:24px;vertical-align: middle;color: #f80;">TMS地图监控平台</span>
        </div>
        <div class="login-content">
          <Form :label-width="60"  ref="login" :model="frmLogin" :rules="ruleLogin">
            <FormItem label="账号：" prop="appkey">
              <Input type="text" v-model="frmLogin.appkey" placeholder="请输入账号" @on-keydown="keydown">
              </Input>
            </FormItem>
            <FormItem label="密码：" prop="appsecret">
              <Input type="password" v-model="frmLogin.appsecret" placeholder="请输入密码" @on-keydown="keydown">
              </Input>
            </FormItem>
            <FormItem label="类型：" prop="type">
              <Input type="text" v-model="frmLogin.type" @on-focus="onFocus" placeholder="请选择访问类型" @on-keydown="keydown">
              </Input>
            </FormItem>
              <Button type="primary" long @click="submit()">登录</Button>
          </Form>
        </div>
      </div>
    </div>
    
    <Modal
        v-model="visible"
        title="请选择访问类型">
        <div style="font-weight: 600;color: #2d8cf0;">
          PC端：
        </div>
        <br>
        <Row :gutter="16">
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'truckMonitor' ? 'success':'ghost'" long @click="onSelectType('truckMonitor')">我的车辆</Button>
          </Col>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'taskMonitor' ? 'success':'ghost'" long @click="onSelectType('taskMonitor')">任务监控</Button>
          </Col>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'playback' ? 'success':'ghost'" long @click="onSelectType('playback')">轨迹回放</Button>
          </Col>
          <br>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'areaManage' ? 'success':'ghost'" long @click="onSelectType('areaManage')">区域规划</Button>
          </Col>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'routeManage' ? 'success':'ghost'" long @click="onSelectType('routeManage')">线路规划</Button>
          </Col>
        </Row>
        <br>
        <div style="font-weight: 600;color: #2d8cf0;">
          移动端：
        </div>
         <br>
        <Row :gutter="16">
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'truckMonitorH5' ? 'success':'ghost'" long @click="onSelectType('truckMonitorH5')">我的车辆</Button>
          </Col>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'taskMonitorH5' ? 'success':'ghost'" long @click="onSelectType('taskMonitorH5')">任务监控</Button>
          </Col>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'playbackH5' ? 'success':'ghost'" long @click="onSelectType('playbackH5')">轨迹回放</Button>
          </Col>
          <br>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'addressManageH5' ? 'success':'ghost'" long @click="onSelectType('addressManageH5')">地址管理</Button>
          </Col>
          <Col span="8" style="margin-bottom: 8px;">
            <Button :type="frmLogin.type == 'addressManageMapH5' ? 'success':'ghost'" long @click="onSelectType('addressManageMapH5')">添加地址</Button>
          </Col>
        </Row>
        <div slot="footer">
          <Button type="primary"  @click="onOk">确定</Button>
        </div>
    </Modal>
  </div>
</template>

<script>
let cryptoJS = require('crypto-js');
export default {
  data() {
    return {
      visible: false,
      frmLogin: {
        appkey: "",
        appsecret: "",
        type: ""
      },
      ruleLogin: {
        appkey: [{
          required: true,
          message: "请输入账号",
          trigger: "blur"
        }],
        appsecret: [{
          required: true,
          message: "请输入密码",
          trigger: "blur"
        }],
        type: [{
          required: true,
          message: "请选择访问类型",
          trigger: "change"
        }]
      }
    };
  },
  methods: {
    keydown(e) {
      var eCode = e.keyCode ? e.keyCode : e.which ? e.which : e.charCode;
      if (eCode == 13) {
        this.submit();
      }
    },
    onFocus() {
      this.visible = true;
    },
    onOk() {
      this.visible = false;
    },
    onSelectType(type) {
      this.frmLogin.type = type;
    },
    submit() {

      this.$refs.login.validate(valid => {
        
        if (!valid) return;

        let time = new Date().getTime();
        let appkey = this.frmLogin.appkey;
        let appsecret = this.frmLogin.appsecret;
        let type = this.frmLogin.type;
        let signature = cryptoJS.MD5(`${appkey}-${appsecret}-${time}`).toString();

        let { href } = this.$router.resolve({
          path: '/authorize',
          query: {
            appkey: appkey,
            signature: signature,
            time: time,
            type: type
          }
        })
        window.open(href, '_blank')

      });
    }
  },
  mounted() {
    this.frmLogin.appkey = this.$storage.getUserInfo() && this.$storage.getUserInfo().appkey; 
  }
};
</script>