export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/trail/index',
    'pages/mine/index',
    'pages/activity/detail/index',
    'pages/activity/qr/index',
    'pages/activity/list/index',
  ],
  tabBar: {
    color: '#8A9288',
    selectedColor: '#2E7D5A',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/index/index', text: '首页' },
      { pagePath: 'pages/trail/index', text: '行者之路' },
      { pagePath: 'pages/mine/index', text: '我的' },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#F7F6F2',
    navigationBarTitleText: '行者学社',
    navigationBarTextStyle: 'black',
  },
})
