<template>
  <div class="container">
    <el-input v-model="hash" class="hash" placeholder="请输入40位hash" @keyup.native.enter="search">
      <template slot="prepend">magnet:?xt=urn:btih:</template>
    </el-input>
    <el-input v-model="file" class="file" placeholder="请输入资源地址" @keyup.native.enter="playFile"></el-input>

    <h3 v-if="links.length > 0"><i class="el-icon-caret-right"></i> 磁链解析结果</h3>
    <div class="list">
      <div class="item-container" v-for="(link, index) in links">
        <el-button class="item" :key="index" :disabled="currentIndex === index" @click.native="switchSource(link, index)">
          {{link.size}} - {{link.name}}
        </el-button>
      </div>
    </div>
    <code v-if="links.length > 0">{{this.links}}</code>
    <div id="player"></div>
    <div v-if="!!player" class="tool-btns">
      <el-button id="download" @click.native="download()" :data-clipboard-text="this.links[this.currentIndex].name">下载</el-button>
      <el-button @click.native="switchSource(links[currentIndex], currentIndex)">刷新</el-button>
    </div>
    <div class="updatelog">
      <p>!!!updatelog</p>
      <p>update: 2017.2.17 页面中刷新按钮为刷新播放器，下载为下载当前播放资源</p>
      <p>update: 2017.2.18 将真实资源链接的请求放到准备播放时进行，减少多文件的同步并发，由于服务器访问量过大，添加真实链接资源请求的重试次数为2次以增加成功率</p>
      <p>update: 2017.2.18 v2 目前只支持MP4格式的视频流，其余格式待修复支持</p>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import cheerio from 'cheerio'
  import {Loading} from 'element-ui'

  function setupPlayer(file) {
    console.log(file)
    let player = jwplayer('player').setup({
      sources: [{file, label: 'mp4', type:'video/mp4',"default": "true"}, {file, label:'webm', type: 'video/webm'}],
      width: "925px",
      height: `${Math.floor(925 / 16 * 9)}px`,
      skin: {
        name: "seven",
        background: "transparent",
      },
      autostart: true,
    });

    return player
  }


  export default{


    data() {
      return {
        hash: '',
        file: '',
        links: [],
        currentIndex: null,
        player: null
      }
    },

    mounted() {
      jwplayer.key="QZmsQXYWSubDbu6xMaztMwYR1sv4uHkcGB7r1A=="
      this.hash = location.search.slice(1);
      /^\w{40}$/.test(this.hash) && this.search()

    },
    head: {
      script: [
//        {src: 'https://content.jwplatform.com/libraries/JFZ2tvwv.js'}
//        {src: 'http://xonline.tv/jwplayer/jwplayer.js?ver=1.2'}
        {src: '/jwplayer.js'}
      ]
    },
    methods: {
      search() {
        let loading = Loading.service({fullscreen:true})
        this.reset()
        this.currentIndex = null
        this.links = []
        window.history.pushState({},0,`${window.location.origin}/?${this.hash}`);
        axios.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/${this.hash}/kankan/`).then(res => {
          if (res.data.apiv_num > 0) {
            return res.data.btinfo
          }else {
            return Promise.reject(new Error('该磁链暂时无法解析'))
          }
        }).then(btinfo => {
          // 种子可以解析，fix 2017.2.18
//          let that = this
//          return axios.all(btinfo.map(function(ele){
//            return axios.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/magnet/${that.hash}/${ele.index}`).then(res => {
//              return {
//                url: extractFileUrl(res.data),
//                hash: that.hash,
//                index: ele.index,
//                name: ele.name,
//                size: `${Math.floor(ele.file_size / 1000 / 1000)}MB`
//              }
//            })
////            let task = await axios.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/magnet/${that.hash}/${ele.index}`).then(res => {
////              return {
////                url: extractFileUrl(res.data),
////                hash: that.hash,
////                index: ele.index,
////                name: ele.name,
////                size: `${Math.floor(ele.file_size / 1000 / 1000)}MB`
////              }
////            })
//
//          })).then(axios.spread(function(...links) {
//            return links
//          }))

          return btinfo.map((ele) => {
            return {
              hash: this.hash,
              index: ele.index,
              name: ele.name,
              size: `${Math.floor(ele.file_size / 1000 / 1000)}MB`
            }
          })
        }).then(links => {
          this.links = links
          loading.close()
        }).catch(e => {
          this.$message.error(e.message)
          loading.close()
        })
      },
      playFile(){
        this.reset()
//        this.currentIndex = null
//        this.links = []
        this.player = setupPlayer(this.file)
      },
      download() {
        window.open(this.links[this.currentIndex].url)
//        window.open(`${this.links[this.currentIndex].url}?filename=1.jpg`);
      },
      switchSource(link, index) {
        this.reset()
        this.currentIndex = index
        let loading = Loading.service({fullscreen:true})

        function extractFileUrl (doc) {
          let $ = cheerio.load(doc)
          let url = ''
          $('script').each(function(i, elem) {
            let text = $(elem).text()
            let result = /a\.src\("(.*)"\)/.exec(text)
            if (result && result.length > 0) {
              url = result[1]
            }
          })
          if (url) {
            return url
          }else {
            throw new Error('未找到url')
          }
        }

        let instance = axios.create();
        instance.interceptors.response.use(retryResponse, undefined);

        function retryResponse (res) {
          try {
            return extractFileUrl(res.data)
          }catch (err) {
            res.config.times = ++res.config.times || 0
            if (err.message === '未找到url' && res.config.times < 2) {
              return instance(res.config)
            }
            throw err
          }
        }
        instance.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/magnet/${this.hash}/${link.index}`).then((url) => {
          this.links[this.currentIndex].url = url
          loading.close()
          return url
        }).then((url) => {


          this.player = setupPlayer(url)
        }).catch(e => {
          this.$message.error(e.message)
          loading.close()
        })

      },
      reset() {
        this.player && this.player.pause() && this.player.remove()
        this.player = null
      }
    }
  }
</script>

<style>

  @import "~assets/jwplayer.css";
  .list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  .item-container {
    width: 40%;
    padding: 10px;
  }
  .item {

    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .item:first-child{
    margin-left: 10px;
  }
  #player {
    margin: 20px auto 0px;
  }
  code {
    margin: 20px;
    word-break:break-all;
  }
  .tool-btns {
    margin: 20px auto;
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
  .file {
    margin-top: 15px;
  }
  .updatelog {
    border-top: 1px solid lightgrey;
    padding: 20px;
    margin-top: 30px;
    color: lightgrey
  }
  .updatelog p {
    margin:0;
  }
</style>


