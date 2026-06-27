import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import './app.css'

// V2.6B: App no longer auto-logs in silently.
// Pages are responsible for calling ensureUserId() when they need it.

class App extends Component<PropsWithChildren> {
  componentDidMount() {}
  componentDidShow() {}
  componentDidHide() {}

  render() {
    return this.props.children
  }
}

export default App
