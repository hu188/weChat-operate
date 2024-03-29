

var BASE_URL = 'https://qsq.mynatapp.cc'
//const BASE_URL = 'https://qsq.mynatapp.cc/qtg/service/external'
// const BASE_URL = 'https://419735c7.ngrok.io/api'
//const BASE_URL = 'https://www.tianrenyun.com.cn/vendor/api'


/**
 ** url:请求地址
  ** data:请求参数
   ** m:post/get 1:post
   ** h:headers 1:json
 */
module.exports =  {
    http:(url, data, m = 'GET', h)=> {
      wx.showLoading({
        title: '加载中...',
      })
        return new Promise((resolve, reject) => {
          if (getApp().globalData.urlType == 1) {
             BASE_URL = 'https://www.tianrenyun.com'
          }
            wx.request({
                url: `${BASE_URL}/${url}`, // 目标服务器url
                data: data,
                method: m ? 'POST' : 'GET',
              // header: { 'content-type': 'application/json'},
                header: { 'content-type': h ? 'application/json' : 'application/x-www-form-urlencoded' },
                success: (res) => {
                    wx.hideLoading();
                    const { status, data,code } = res.data
                    if (code * 1 === 0) {
                      resolve(data)
                    } 
                     else if (code * 1 === 77) { //会话过期,重新登录
                      wx.showToast({
                        title: '登录过期',
                        icon: 'loading'
                      })
                    } else if (code * 1 === 78){
                      wx.showToast({
                        title: '请求发生错误！',
                        icon:'loading'
                      })
                    }
                },
                fail: err=> {
                  console.log(err)
                    wx.hideLoading();
                },
                complete: res => {
                  console.log()
                }
            });
         
        })
    
    }
}