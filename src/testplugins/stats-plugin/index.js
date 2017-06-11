
import React, {Component} from 'react'
import PropTypes from 'prop-types'

const Stats = (props) => {
  const {blockCount} = props

  return (
    <div className='StatsPlugin-Stats'>
      Block count: {blockCount}
    </div>
  )
}

const editorToProps = (WrappedComponent, xform) => class extends Component {
  static propTypes = {
    editorState: PropTypes.object.isRequired
  }

  render () {
    return (
      <WrappedComponent {...xform(this.props.editorState)} />
    )
  }
}

const createStatsPlugin = (config = {}) => {
  return {
    // initialize: ({getEditorState}) => {
    // },
    // onChange: (editorState) => {
    //   store.blockCount = editorState.getCurrentContent().getBlockMap().size
    //   console.log('stats onchange', store.blockCount)
    //   return editorState
    // },

    // Components
    // Stats: <Stats store={store} /> // decorate(Stats, {store})
    // Stats: decorate(Stats, {store})
    Stats: editorToProps(Stats, (editorState) => ({
      blockCount: editorState.getCurrentContent().getBlockMap().size
    }))
  }
}

export default createStatsPlugin
