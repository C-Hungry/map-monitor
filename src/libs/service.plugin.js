var ApiServicePlugin = {};

ApiServicePlugin.install = function (Vue) {

  var fetch = function(url, data, type, contentType) {

    data = data ? data : {};
    type = type.toUpperCase();

    return new Promise(function(resolve, reject) {

      var dataStr = ''; //数据拼接字符串
      var sendData = {};

      Object.keys(data).forEach(function(key) {
        if (typeof (data[key]) == "object") {
          sendData = data[key];
        }
        else {
          dataStr += key + '=' + data[key] + '&';
        }
      })

      if (dataStr !== '') {
        dataStr = dataStr.substr(0, dataStr.lastIndexOf('&'));
        url = url + '?' + dataStr;
      }

      var requestObj;
      if (window.XMLHttpRequest) {
        requestObj = new XMLHttpRequest();
      } else {
        requestObj = new ActiveXObject();
      }
      requestObj.open(type, url, true);
      requestObj.setRequestHeader("Accept", "application/json");
      requestObj.setRequestHeader("Content-type", contentType ? contentType : "application/json");
      requestObj.setRequestHeader("Authorization", window.VueRootInstance.$storage.getToken());

      if (sendData instanceof FormData) {
        requestObj.send(sendData);
      }
      else {
        requestObj.send(JSON.stringify(sendData));
      }

      requestObj.onreadystatechange = function() {
        if (requestObj.readyState == 4) {
          var obj = requestObj.response;
          if (obj && typeof obj !== 'object') {
            try {
              obj = JSON.parse(obj);
            } catch (error) {
              reject({
                success: false,
                msg: "服务器内部错误！",
                data: null
              });
              return;
            }
          }
          //api返回数据-成功
          if (requestObj.status == 200) {
            resolve(obj);
          }
          //api返回数据-失败-token过期
          else if (requestObj.status == 401) {
            resolve({
              success: false,
              msg: "当前用户登录信息已过期！",
              data: null
            });
            setTimeout(function() {
              window.top.VueRootInstance.$loginService.logout();
            }, 200);
          }
          //api返回数据-失败-无权限
          else if (requestObj.status == 405) {
            resolve({
              success: false,
              msg: "当前用户登录无权限访问！",
              data: null
            });
          }
          //api返回数据-失败-未知错误
          else {
            reject({
              success: false,
              msg: "未知错误！",
              data: null
            });
          }
        }
      }
    });
  };
  // 业务
  Vue.prototype.$commonService = {
    get: function (url, data) {
      url = window.VueRootInstance.$config.get("commonBaseUrl") + url;
      return fetch(url, data, "GET");
    },
    post: function (url, data) {
      url = window.VueRootInstance.$config.get("commonBaseUrl") + url;
      return fetch(url, data, "POST");
    }
  };
  // 地图
  Vue.prototype.$bizService = {
    get: function (url, data) {
      url = window.VueRootInstance.$config.get("bizUrl") + url;
      return fetch(url, data, "GET");
    },
    post: function (url, data) {
      url = window.VueRootInstance.$config.get("mapUrl") + url;
      return fetch(url, data, "POST");
    }
  };
}

module.exports = ApiServicePlugin;