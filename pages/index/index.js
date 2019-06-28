//index.js
//获取应用实例
var app = getApp();
import { http } from '../../utils/http';
import { encode } from '../../utils/encode';
const { $Message } = require('../../Components/base/index');
const util = require('../../utils/util.js')
Page({
  data: {
    userInfo: null,
    hasUserInfo: true,
    userNick: '',
    isHide: false,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    sign:'',//加密的设备名字
    deviceName:''
  },
 
  onLoad: function (options) {
    //判断是否授权用户信息
    var that = this;
    //BmcKLAeVhAeVhAc
    var url = 'https://www.tianrenyun.com/qsq/bhgl/?sign=&type=1'

    if (options.q) {
      url = decodeURIComponent(options.q);
    }
    that.decodeUrl(url)

    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: resSetting => {
              app.globalData.userInfo = resSetting.userInfo;
              that.setData({
                userInfo: resSetting.userInfo,
                hasUserInfo: true,
                userNick: resSetting.userInfo.nickName
              });
            }
          });

          that.login();
        } else {
          that.setData({
            hasUserInfo: true,
            isHide: true
          });
        }
      }
    });

  },
  //解析二维码
  decodeUrl(url) {
    if (url) {
      url = url
    }
    var urlList = url.split("?")
   
    var params = urlList[1].split("&")
    var sign = params[0].split("=")
    var type = params[1].split("=")
    this.setData({
      sign: sign[1]
    })
    app.globalData.urlType = type[1];
  },
  login() {
    var _self = this;
    wx.login({
      scopes: 'auth_user',
      success: (res) => {
        wx.getUserInfo({
          success: result => {
            const data = {
              "code": res.code,
              "keyPoolId": "17", //小程序id
            }
            let { encryptedData, iv } = result

            http('qsq/miniService/miniProComm/weChatCommon/commonLogin', JSON.stringify(data), 1, 1).then(lres => {
              app.globalData.sessionId = lres.sessionId;
              app.globalData.openid = lres.openid;
              const params = {
                sign: encode({
                  openid: lres.openid,
                  encryptedData: encryptedData,
                  iv: iv
                }, lres.sessionId),
                sessionId: lres.sessionId,
                params: {
                  openid: lres.openid,
                  encryptedData: encryptedData,
                  iv: iv
                }
              }
              http('qsq/miniService/miniProComm/weChatCommon/saveAnalysisData', JSON.stringify(params), 1, 1).then(sres => {
                if (_self.data.sign){
                  _self.queryDevice(_self.data.sign);
                }
                
              })
          

            })
          }
        })
      }
    })
  },


  getUserInfo: function (e) {
    app.globalData.userInfo = e.detail.userInfo
    const {
      errMsg
    } = e.detail
    if (errMsg === 'getUserInfo:ok') {
      this.setData({
        userInfo: e.detail.userInfo,
        hasUserInfo: true,
        userNick: e.detail.userInfo.nickName,
        isHide: false
      });
      this.login();
    }

  },
  //根据设备名查找设备
  queryDevice(sign) {
    let that = this
    if (sign) {
      const params = {
        sign: encode({
          sign: sign
        }, app.globalData.sessionId),
        sessionId: app.globalData.sessionId,
        params: {
          sign: sign
        }
      }
      http('qsq/service/external/weChatDevice/deviceData', JSON.stringify(params), 1, 1).then(res=>{
        if(res){
          that.setData({
            deviceName: res.authInfo,
            deviceId: res.deviceId
          })
        }
      
      })
      }
    },
  scan(){
    let that = this;
    // 允许从相机和相册扫码
    wx.scanCode({
      success(res) {
        console.log(res.result)
        that.decodeUrl(res.result)
        that.queryDevice(that.data.sign)
      }
    })
  },
  operateOrder(e){
    let that = this;
    let id = e.currentTarget.dataset.id
    console.log(id)
    if(id==5 || id==6){
      wx.showModal({
        title: '温馨提示',
        content: '您确定清料吗',
        success(res){
          if (res.confirm) {
            that.sendOrder(id)
          } 
        }
      })
    }else{
      that.sendOrder(id)
    }
   
  },
  sendOrder(id){
    let { sign, deviceId } = this.data
    //查询设备状态
    const params = {
      sign: encode({
        sign: sign
      }, app.globalData.sessionId),
      sessionId: app.globalData.sessionId,
      params: {
        sign: sign
      }
    }
    http('qsq/service/external/weChatDevice/deviceStatus', JSON.stringify(params), 1, 1).then(res => {
      if (res) {
        $Message({
          content: res
        });
      } else {
        //发送73包
        const params = {
          sign: encode({
            code: id,
            orderCode: 8,
            deviceId: deviceId
          }, app.globalData.sessionId),
          sessionId: app.globalData.sessionId,
          params: {
            code: id,
            orderCode: 8,
            deviceId: deviceId
          }
        }
        http('qsq/service/external/weChatDevice/deviceOperateOrder', JSON.stringify(params), 1, 1).then(res => {
          if (res.result) {
            $Message({
              content: res.result
            });
          } else {
            $Message({
              content: "命令已发送",
              type: 'success'
            });
          }
        })
      }
    })
  },
  //点击补货
  replenish(){
  
    let {sign,deviceId} = this.data
    //查询设备状态
    const params = {
      sign: encode({
        sign:sign
      }, app.globalData.sessionId),
      sessionId: app.globalData.sessionId,
      params: {
        sign:sign
      }
    }
    http('qsq/service/external/weChatDevice/deviceStatus', JSON.stringify(params), 1, 1).then(res=>{
        if(res){
          $Message({
            content: res
          });
        }else{
          // 允许从相机和相册扫码
          wx.scanCode({
            success(res) {
              console.log('补货码：' + res.result + "," + res.result.length)
              if (res.result.length!=13){
                $Message({
                  content: "补货码有误，请检查",
                  type: 'error'
                });
              }else{
                //发送73包
                const params = {
                  sign: encode({
                    code: res.result,
                    orderCode: 7,
                    deviceId: deviceId
                  }, app.globalData.sessionId),
                  sessionId: app.globalData.sessionId,
                  params: {
                    code: res.result,
                    orderCode: 7,
                    deviceId: deviceId
                  }
                }
                http('qsq/service/external/weChatDevice/deviceOperateOrder', JSON.stringify(params), 1, 1).then(res => {
                  if (res.result) {
                    $Message({
                      content: res.result
                    });
                  } else {
                    $Message({
                      content: "命令已发送",
                      type: 'success'
                    });
                  }
                })
              }
             
            }
          })

        }
    })
  },

})
