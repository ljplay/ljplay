<template>
  <div>
    <nuxt id="container"/>
    <footer>
      <div>© 2017 leftjs</div>
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
</style>

