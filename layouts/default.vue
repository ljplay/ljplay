<template>
  <div>
    <nuxt id="container"/>
    <footer>
      <div class="left">
        <a href="https://github.com/leftjs"><img src="~assets/avatar.jpeg" alt=""></a>
        © 2017 leftjs@github.com
      </div>
      <div><el-button @click.native="contact()" :plain="true" type="info">给我写邮件 leftjs@foxmail.com</el-button></div>
    </footer>
  </div>
</template>

<script>
  export default {
    methods: {
      contact() {
        window.location.href = "mailto:leftjs@foxmail.com"
      }
    }
  }
</script>

<style>
  #container{
    margin-bottom: 120px;
  }
  footer {
    width: 100%;
    height: 100px;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    background: rgba(#58B7FF, 0.3);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .left {
    display: flex;
    align-items: center;
  }
  .left img {
    width: 50px;
    height: 50px;
    border-radius: 25px;
    margin-right: 20px;
  }
</style>

