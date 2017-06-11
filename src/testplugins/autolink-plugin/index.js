import Autolinker from 'autolinker'
import React from 'react'

const Link = (props) => {
  // console.log(props)
  // const {url} = props.contentState.getEntity(props.entityKey).getData()
  const {decoratedText} = props

  return (
    <a href={decoratedText}>
      {props.children}
    </a>
  )
}

export default (config = {}) => {
  const autolinker = new Autolinker(Object.assign({
    email: false,
    hashtag: false,
    mention: false,
    phone: false,
    urls: true
  }, config.autolinkerOptions || {}))

  const decorators = [
    {
      strategy: (contentBlock, callback, contentState) => {
        const text = contentBlock.getText()
        const matches = autolinker.parse(text)
        // Ignore links in code blocks
        if (contentBlock.getType() === 'code-block') {
          return false
        }
        matches.forEach((match) => {
          const start = match.offset
          callback(start, start + match.matchedText.length)
        })
        return false
      },
      component: Link
    }
  ]

  return {
    decorators
  }
}
