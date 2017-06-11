
import React from 'react'
import Store from '../store'

const Stats = (props) => {
  const {blockCount} = props

  return (
    <div className='StatsPlugin-Stats'>
      Block count: {blockCount}
    </div>
  )
}

export default (config = {}) => {
  const store = new Store({
    blockCount: 1
  })

  return {
    onChange: (editorState) => {
      const blockCount = editorState.getCurrentContent().getBlockMap().size
      store.setState({ blockCount })
    },
    // Components
    Stats: store.withSubs(Stats, ['blockCount'])
  }
}
