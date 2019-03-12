var ConfigPlugin = {};

ConfigPlugin.install = function (Vue) {

  Vue.prototype.$config = new function(){

    var config = {
      // tms
      commonBaseUrl: "http://192.168.3.199:9020",
      // commonBaseUrl: "http://60.205.164.169:9020",
      // 地图轨迹回放
      bizUrl: "http://59.110.17.80:8011",
      // websocket
      websocketUrl: "ws://59.110.17.80:5001/GPSWebSocketService",
      // 密钥
      key: "zkkj",
    };

    if (window.service && window.service.commonBaseUrl) {
      config.commonBaseUrl = window.service.commonBaseUrl;
    }
    if (window.service && window.service.bizUrl) {
      config.bizUrl = window.service.bizUrl;
    }
    if (window.service && window.service.websocketUrl) {
      config.websocketUrl = window.service.websocketUrl;
    }

    this.get = function(key){
      return config[key];
    }

    this.set = function(key,value){
      if(!config.hasOwnProperty(key)){
        console.log("设置ZK-API服务地址[" + key + "]失败！此服务未定义。");
        return false;
      }
      config[key] = value;
      return true;
    };

  }();
  
}

module.exports = ConfigPlugin;