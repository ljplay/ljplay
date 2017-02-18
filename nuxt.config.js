module.exports = {
  // cache: true
  css: [
    'element-ui/lib/theme-default/index.css'
  ],
  plugins: [
    '~plugins/element-ui.js'
  ],
  vendor: ['axios', 'element-ui', 'cheerio'],
  head: {

  },
  build: {
    postcss: [
      require('postcss-hexrgba')(),
      require('autoprefixer')({
        browsers: ['last 3 versions']
      })
    ]
  }
}
