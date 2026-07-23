import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import './app.scss'

let _ready = false
let _initializing = false

function initApp() {
  if (_initializing || _ready) return
  _initializing = true
  try {
    useAuthStore.getState().initialize().then(() => {
      _ready = true
    }).catch(() => {
      _ready = true
    })
  } catch {
    _ready = true
  }
}

class App extends Taro.Component<
  { children?: Taro.ReactNode },
  { ready: boolean }
> {
  state: { ready: boolean } = { ready: false }

  constructor(props: any) {
    super(props)
    initApp()
  }

  componentDidMount() {
    this.checkReady()
  }

  checkReady = () => {
    if (_ready) {
      this.setState({ ready: true })
    } else {
      setTimeout(() => this.checkReady(), 100)
    }
  }

  render() {
    if (!this.state.ready && !_ready) {
      this.checkReady()
      return (
        <View className='app-loading'>
          <Text>星寰海</Text>
        </View>
      )
    }

    return this.props.children || null
  }
}

export default App
