var StoragePlugin = {};

StoragePlugin.install = function (Vue) {

  Vue.prototype.$storage = new function() {

    /**
     * 存储用户信息
     */
    this.saveUserInfo = function(content) {
      if (typeof content !== 'string') {
        content = JSON.stringify(content);
      }
      window.localStorage.setItem("userInfo", content);
    }

    /**
     * 获取用户信息
     */
    this.getUserInfo = function() {
      return JSON.parse(window.localStorage.getItem("userInfo"));
    }

    /**
     * 删除用户信息
     */
    this.removeUserInfo = function() {
      window.localStorage.removeItem("userInfo");
    }

    /**
     * 保存TOKEN
     */
    this.saveToken = function(str) {
      window.localStorage.setItem("token", str);
    }

    /**
     * 删除TOKEN
     */
    this.removeToken = function() {
      window.localStorage.removeItem("token");
    }

    /**
     * 获取TOKEN
     */
    this.getToken = function() {
      return window.localStorage.getItem("token");
    }

    /**
     * 存储公司地理坐标
     */
    this.saveCorpCenter = function(content) {
      if (typeof content !== 'string') {
        content = JSON.stringify(content);
      }
      window.localStorage.setItem("corpCenter", content);
    }

    /**
     * 获取公司地理坐标
     */
    this.getCorpCenter = function() {
      return JSON.parse(window.localStorage.getItem("corpCenter"));
    }

    /**
     * 删除公司地理坐标
     */
    this.removeCorpCenter = function() {
      window.localStorage.removeItem("corpCenter");
    }

    /**
     * 存储省市区三级联动
     */
    this.saveCascaderAddress = function(content) {
      if (typeof content !== 'string') {
        content = JSON.stringify(content);
      }
      window.localStorage.setItem("cascaderAddress", content);
    }

    /**
     * 获取省市区三级联动
     */
    this.getCascaderAddress = function() {
      return JSON.parse(window.localStorage.getItem("cascaderAddress"));
    }

    /**
     * 删除省市区三级联动
     */
    this.removeCascaderAddress = function() {
      window.localStorage.removeItem("cascaderAddress");
    }

  }();
}

module.exports=StoragePlugin;