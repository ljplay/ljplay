<template>
  <div class="container">
    <el-input v-model="hash" class="hash" placeholder="请输入磁链或者40位hash" @keyup.native.enter="search"></el-input>
    <el-input v-model="file" class="file" placeholder="请输入资源地址" @keyup.native.enter="playFile"></el-input>

    <h3 v-if="links.length > 0"><i class="el-icon-caret-right"></i> 磁链解析结果</h3>
    <div class="list">
      <el-button v-for="(link, index) in links" class="item" :key="index" :disabled="currentIndex === index" @click.native="switchSource(link, index)">
        {{link.size}} - {{link.name}}
      </el-button>
    </div>
    <code v-if="links.length > 0">{{this.links}}</code>
    <div id="player"></div>
    <div v-if="!!player" class="tool-btns">
      <el-button id="download" @click.native="download()" :data-clipboard-text="this.links[this.currentIndex].name">下载</el-button>
      <el-button @click.native="switchSource(links[currentIndex], currentIndex)">刷新</el-button>
    </div>
  </div>
</template>

<script>
  import axios from 'axios'
  import cheerio from 'cheerio'
  import {Loading} from 'element-ui'

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
    return url
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
        console.log('enter')
        let loading = Loading.service({fullscreen:true})
        this.reset()
        this.currentIndex = null
        this.links = []
        window.history.pushState({},0,`http://${window.location.host}/?${this.hash}`);
        axios.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/${this.hash}/kankan/`).then(res => {
          if (res.data.apiv_num > 0) {
            return res.data.btinfo
          }else {
            return Promise.reject(new Error('该磁链暂时无法解析'))
          }
        }).then(btinfo => {
          // 种子可以解析
          let that = this
          return axios.all(btinfo.map(function(ele){
            return axios.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/magnet/${that.hash}/${ele.index}`).then(res => {
              return {
                url: extractFileUrl(res.data),
                hash: that.hash,
                index: ele.index,
                name: ele.name,
                size: `${Math.floor(ele.file_size / 1000 / 1000)}MB`
              }
            })
//            let task = await axios.get(`https://bird.ioliu.cn/v1?url=https://apiv.ga/magnet/${that.hash}/${ele.index}`).then(res => {
//              return {
//                url: extractFileUrl(res.data),
//                hash: that.hash,
//                index: ele.index,
//                name: ele.name,
//                size: `${Math.floor(ele.file_size / 1000 / 1000)}MB`
//              }
//            })

          })).then(axios.spread(function(...links) {
            return links
          }))
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
        this.currentIndex = null
        this.links = []
        this.player = jwplayer('player').setup({
          sources: [{file: this.file, label: 'default', type:'video/mp4',}],
          width: "925px",
          height: `${Math.floor(925 / 16 * 9)}px`,
          skin: {
            name: "seven",
            background: "transparent",
          },
          autostart: true,
        });
      },
      download() {
        window.open(this.links[this.currentIndex].url)
//        window.open(`${this.links[this.currentIndex].url}?filename=1.jpg`);
      },
      switchSource(link, index) {
        this.reset()
        this.currentIndex = index
        this.player = jwplayer('player').setup({
          sources: [{file: link.url, label: 'default', type:'video/mp4',}],
          width: "925px",
          height: `${Math.floor(925 / 16 * 9)}px`,
          skin: {
            name: "seven",
            background: "transparent",
          },
          autostart: true,
        });
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
  .item {
    width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
</style>


