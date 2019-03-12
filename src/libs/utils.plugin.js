var CryptoJS = require("crypto-js");
var UtilsPlugin = {};

UtilsPlugin.install = function (Vue) {

  Vue.prototype.$utils = new function() {

    this.encrypt = function(str) {
      return CryptoJS.AES.encrypt(str, config.key).toString();
    };

    this.decrypt = function(str) {
      return CryptoJS.AES.decrypt(str.replace(/ /g, '+'), config.key).toString(CryptoJS.enc.Utf8);
    };

    this.formateDate = function (datetime, formate) {

      if(!formate) formate = "yyyy-MM-dd HH:mm:ss"
      if (!datetime) return "";

      datetime = new Date(datetime);

      var str = formate;
      var Week = ['日', '一', '二', '三', '四', '五', '六'];

      str = str.replace(/yyyy|YYYY/, datetime.getFullYear());
      str = str.replace(/yy|YY/, (datetime.getYear() % 100) > 9 ? (datetime.getYear() % 100).toString() : '0' + (datetime.getYear() % 100));

      str = str.replace(/MM/, (datetime.getMonth()+1) > 9 ? (datetime.getMonth()+1).toString() : '0' + (datetime.getMonth()+1));
      str = str.replace(/M/g, (datetime.getMonth()+1));

      str = str.replace(/w|W/g, Week[datetime.getDay()]);

      str = str.replace(/dd|DD/, datetime.getDate() > 9 ? datetime.getDate().toString() : '0' + datetime.getDate());
      str = str.replace(/d|D/g, datetime.getDate());

      str = str.replace(/hh|HH/, datetime.getHours() > 9 ? datetime.getHours().toString() : '0' + datetime.getHours());
      str = str.replace(/h|H/g, datetime.getHours());
      str = str.replace(/mm/, datetime.getMinutes() > 9 ? datetime.getMinutes().toString() : '0' + datetime.getMinutes());
      str = str.replace(/m/g, datetime.getMinutes());

      str = str.replace(/ss|SS/, datetime.getSeconds() > 9 ? datetime.getSeconds().toString() : '0' + datetime.getSeconds());
      str = str.replace(/s|S/g, datetime.getSeconds());

      return str;
    }

    this.unique = function(){
      return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
          return v.toString(16);
      });
    }

    /**
     * WGS84转GCj02
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    const x_PI = 3.14159265358979324 * 3000.0 / 180.0;
    const PI = 3.1415926535897932384626;
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    this.wgs84togcj02 = (lng, lat) => {
      if (this.out_of_china(lng, lat)) {
        return [lng, lat]
      } else {
        let dlat = this.transformlat(lng - 105.0, lat - 35.0);
        let dlng = this.transformlng(lng - 105.0, lat - 35.0);
        let radlat = lat / 180.0 * PI;
        let magic = Math.sin(radlat);
        magic = 1 - ee * magic * magic;
        let sqrtmagic = Math.sqrt(magic);
        dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
        dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
        let mglat = lat + dlat;
        let mglng = lng + dlng;
        return [mglng, mglat]
      }
    }
    /**
     * 火星坐标系 (GCJ-02) 与百度坐标系 (BD-09) 的转换
     * 即谷歌、高德 转 百度
     * @param lng
     * @param lat
     * @returns {*[]}
     */
    this.gcj02tobd09 = (lng, lat) => {
      let z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
      let theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
      let bd_lng = z * Math.cos(theta) + 0.0065;
      let bd_lat = z * Math.sin(theta) + 0.006;
      return [bd_lng, bd_lat]
    }

    this.bd09togcj02 = (bd_lon, bd_lat) => {
      bd_lon = +bd_lon;
      bd_lat = +bd_lat;
      let x = bd_lon - 0.0065;
      let y = bd_lat - 0.006;
      let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_PI);
      let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_PI);
      let gg_lng = z * Math.cos(theta);
      let gg_lat = z * Math.sin(theta);
      return [gg_lng, gg_lat]
    }
    /**
     * 判断是否在国内，不在国内则不做偏移
     * @param lng
     * @param lat
     * @returns {boolean}
     */
    this.out_of_china = (lng, lat) => {
      return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);
    }
    this.transformlat = (lng, lat) => {
      let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
      ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
      ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
      return ret
    }
    this.transformlng = (lng, lat) => {
      let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
      ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
      ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
      ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
      return ret
    }
    
  }();
}

module.exports=UtilsPlugin;