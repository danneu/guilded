
const isList = (type) => ['unordered-list-item', 'ordered-list-item'].includes(type)

// opts is {styleMap = {}, autolinker, depth = 0}
export default function astToHtml (ast = [], opts) {
  const {depth = 0} = opts
  // return ast.map((node) => renderBlock(node, lists))
  const html = []
  let listNodes = []

  // nodeType is inline | block | entity
  ast.forEach(([nodeType, args]) => {
    if (nodeType === 'inline') {
      const [styles, text] = args
      html.push(styles.reduce((html, style) => {
        switch (style) {
          case 'BOLD': return `<b>${html}</b>`
          case 'ITALIC': return `<i>${html}</i>`
          case 'UNDERLINE': return `<u>${html}</u>`
          case 'STRIKETHROUGH': return `<s>${html}</s>`
          default:
            // const css = Object.entries(styleMap[style]).map(([k, v]) => {
            //   return `${hyphenate(k)}: ${v};`
            // })
            // return `<span style="${css}">${html}</span>`
            return `<span class="${style}">${html}</span>`
        }
      }, escapeHtml(text)))
      return
    }

    // Ignore entities for now
    if (nodeType === 'entity') {
      return
    }

    // it's block
    const [type, key, [...kids], data] = args

    const currNode = {type, key, kids, depth, data}
    if (isList(type)) {
      listNodes.push(currNode)
    } else {
      if (listNodes.length > 0) {
        html.push(renderList(listNodes, opts))
        listNodes = []
      }
      html.push(renderNode(currNode, opts))
    }
  })

  if (listNodes.length > 0) {
    html.push(renderList(listNodes, opts))
    listNodes = []
  }

  return html.join('')
}

// kids will are inline or block
function renderNode ({type, key, depth, kids, data}, opts) {
  // console.log(`[renderNode] type=${type}, key=${key}`)
  const html = []

  let string = astToHtml(kids, Object.assign({}, opts, { depth: opts.depth + 1 }))

  if (string.length === 0) {
    if (type === 'unstyled') {
      // empty unstyled blocks should act like newlines
      string = '<br>'
    } else {
      // ignore empty non-unstyled nodes
      return ''
    }
  }

  // autolink everywhere except in code block
  if (opts.autolinker && type !== 'code-block') {
    string = opts.autolinker.link(string)
  }

  let classes = []

  switch (data.align) {
    case 'CENTER': classes.push('align-center'); break
    case 'RIGHT': classes.push('align-right'); break
    case 'JUSTIFY': classes.push('align-justify'); break
  }

  let attr = ''

  if (classes.length > 0) {
    attr += ` class="${classes.join(' ')}"`
  }

  switch (type) {
    case 'unstyled': html.push(`<div${attr}>${string}</div>`); break
    case 'unordered-list-item': html.push(string); break
    case 'ordered-list-item': html.push(string); break
    case 'code-block': html.push(`\n<pre${attr}>${string}</pre>`); break
    case 'header-one': html.push(`<h1${attr}>${string}</h1>`); break
    case 'header-two': html.push(`<h2${attr}>${string}</h2>`); break
    case 'header-three': html.push(`<h3${attr}>${string}</h3>`); break
    default:
      console.error('unexpected type: ' + type)
  }

  return html.join('')
}

function renderList (listNodes, opts) {
  // console.log(`[renderList] nodes=${listNodes.length}`, listNodes)
  const html = []
  let nestedListNodes = []
  let prevNode = null

  const getTag = (type) => {
    switch (type) {
      case 'unordered-list-item': return 'ul'
      case 'ordered-list-item': return 'ol'
    }
  }

  listNodes.forEach((currNode) => {
    let nestedNode = false
    if (!prevNode) {
      html.push(`<${getTag(currNode.type)}>`)
    } else if (prevNode.type !== currNode.type) {
      html.push(`</${getTag(prevNode.type)}>`)
      html.push(`<${getTag(currNode.type)}>`)
    } else if (prevNode.depth === currNode.depth) {
      if (nestedListNodes.length > 0) {
        html.push(renderList(nestedListNodes, opts))
        nestedListNodes = []
      }
    } else {
      nestedNode = true
      nestedListNodes.push(currNode)
    }

    if (!nestedNode) {
      const string = renderNode(currNode, opts)
      // ignore empty
      if (string.length > 0) {
        html.push(`<li>${string}</li>`)
      }
      prevNode = currNode
    }
  })

  if (nestedListNodes.length > 0) {
    html.push(renderList(nestedListNodes, opts))
  }

  html.push(`</${getTag(prevNode.type)}>`)
  return html.join('')
}

const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
}

function escapeHtml (string) {
  return String(string).replace(/[&<>"'`=/]/g, (s) => entityMap[s])
}
