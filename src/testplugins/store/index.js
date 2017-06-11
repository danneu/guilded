
import EventEmitter from 'eventemitter3'
import React from 'react'

export default class Store extends EventEmitter {
  constructor (initState = {}) {
    super()
    this.state = initState
  }

  get (key) {
    return this.state[key]
  }

  setState (obj) {
    Object.entries(obj).forEach(([k, v]) => {
      if (this.get(k) === v) return
      // else it changed
      this.state[k] = v
      this.emit(k)
    })
  }

  withSubs (WrappedComponent, events = [], initProps = {}) {
    const store = this

    return class extends React.Component {
      static defaultProps = {
        ...initProps
      }

      constructor (props) {
        super(props)
        this.state = { ...store.state }
        this.onUpdate = () => {
          this.setState({ ...store.state })
        }
      }

      componentWillMount () {
        events.forEach((event) => {
          store.on(event, this.onUpdate)
        })
      }

      componentWillUnmount () {
        events.forEach((event) => {
          store.removeListener(event, this.onUpdate)
        })
      }

      render () {
        return (
          <WrappedComponent {...this.state} {...this.props} />
        )
      }
    }
  }
}
