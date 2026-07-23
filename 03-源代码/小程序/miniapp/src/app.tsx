import { View, Text } from '@tarojs/components'
import Taro, { useLaunch, useRouter } from '@tarojs/taro'
import { useAuthStore } from './stores/authStore'
import './app.scss'

let _ready = false
let _listeners: Array<() => void> = []

function notifyReady() {
  _ready = true
  _listeners.forEach(fn => fn())
  _listeners = []
}

function onReady(fn: () => void) {
  if (_ready) { fn(); return }
  _listeners.push(fn)
}

function Initializer({ children }: any) {
  useLaunch(() => {
    try {
      useAuthStore.getState().initialize().then(() => {
        notifyReady()
      }).catch(() => {
        notifyReady()
      })
    } catch {
      notifyReady()
    }
  })

  return children
}

class App extends Taro.Component<any, { ready: boolean }> {
  state = { ready: false }
  _unsub: (() => void) | null = null

  componentDidMount() {
    this._unsub = this.forceUpdate.bind(this)
    onReady(() => {
      this.setState({ ready: true })
    })
  }

  componentWillUnmount() {
    this._unsub = null
  }

  render() {
    if (!this.state.ready) {
      return (
        <View className='app-loading'>
          <Text>星寰海</Text>
        </View>
      )
    }

    const { children } = this.props
    return (
      <Initializer>
        {children}
      </Initializer>
    )
  }
}

export default App
