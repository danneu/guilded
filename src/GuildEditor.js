import I from 'immutable'
import React from 'react'
import {ButtonGroup, Button} from 'react-bootstrap'
import PropTypes from 'prop-types'
import Autolinker from 'autolinker'
import modifyInlineStyles from './util/modifyInlineStyles'
import Draft, {
  ContentState,
  DefaultDraftBlockRenderMap,
  convertToRaw,
  Editor,
  EditorState,
  RichUtils,
  Modifier,
  CompositeDecorator
} from 'draft-js'
import CodeUtils from 'draft-js-code'
import './Draft.css'
import './GuildEditor.css'
import arrayChunk from 'array.chunk'
import belt from './belt'

import Perf from 'react-addons-perf'
React.addons = {}
React.addons.Perf = Perf
window.React = React

function getCurrentBlock (editorState) {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  console.assert(selectionState.getStartKey())
  return contentState.getBlockForKey(selectionState.getStartKey())
}

I.OrderedSet.prototype.hasAny = function (xs) {
  return xs.some((v) => this.has(v))
}

// TODO: Replace all of these with {ButtonGroup} from 'react-bootstrap'
const BtnGroup = (props) => {
  return (
    <div className='btn-group'>
      {props.children}
    </div>
  )
}

const blockRendererFn = (contentBlock) => {
}

const blockRenderMap = DefaultDraftBlockRenderMap.merge(I.Map({
}))

const blockStyleFn = (block) => {
  let className = ''
  const data = block.getData()

  // Lists cannot be aligned
  if (data.get('align') && !['ordered-list-item', 'unordered-list-item'].includes(block.getType())) {
    className += ` align-${data.get('align').toLowerCase()}`
  }

  return className
}

/// //////////////////////////////////////////////

class StyleButton extends React.PureComponent {
  constructor (props) {
    super(props)
    this._onToggle = (e) => {
      e.preventDefault()
      this.props.onToggle()
    }
  }

  render () {
    let className = 'StyleButton btn btn-sm'
    className += this.props.active ? ' btn-primary' : ' btn-default'

    const child = this.props.fa
      ? <i className={`fa fa-${this.props.fa}`} />
    : this.props.label || this.props.children

    return (
      <span className={className} onMouseDown={this._onToggle} style={this.props.styleMap} title={this.props.label}>
        {child}
      </span>
    )
  }
}

// StyleButton.propTypes = {
//   onToggle: PropTypes.func.isRequired,
//   active: PropTypes.bool.isRequired,
//     // Optional
//   styleMap: PropTypes.object,
//   fa: PropTypes.string,
//   label: PropTypes.string
// }

/// //////////////////////////////////////////////

const makeHandleKeyCommand = ({getEditorState, onChange}) => (command) => {
  console.log(`[handleKeyCommand] comment=`, command)
  let newState

  const editorState = getEditorState()

  if (CodeUtils.hasSelectionInBlock(editorState)) {
    newState = CodeUtils.handleKeyCommand(editorState, command)
  }

  if (!newState) {
    newState = RichUtils.handleKeyCommand(editorState, command)
  }

  if (newState) {
    onChange(newState)
    return 'handled'
  }

  return 'not-handled'
}

// e is SyntheticKeyboardEvent, returns string
const makeKeyBindingFn = ({getEditorState}) => (e) => {
  console.log(`[keyBindingFn]`)
  const editorState = getEditorState()
  let command

  if (CodeUtils.hasSelectionInBlock(editorState)) {
    command = CodeUtils.getKeyBinding(e)
  }
  if (command) {
    return command
  }

  return Draft.getDefaultKeyBinding(e)
}

const makeHandleReturn = ({getEditorState, onChange}) => (e) => {
  console.log(`[handleRrturn]`)
  const editorState = getEditorState()
  if (!CodeUtils.hasSelectionInBlock(editorState)) {
    return 'not-handled'
  }

  onChange(CodeUtils.handleReturn(e, editorState))
  return 'handled'
}

const makeHandleTab = ({getEditorState, onChange}) => (e) => {
  console.log(`[handleTab]`)
  const editorState = getEditorState()

  if (!CodeUtils.hasSelectionInBlock(editorState)) {
    return 'not-handled'
  }

  onChange(CodeUtils.handleTab(e, editorState))
  return 'handled'
}

const makeHandlePastedText = ({getEditorState, onChange}) => (text, html) => {
  console.log(`[handlePaste]`)
  let editorState = getEditorState()

  if (!CodeUtils.hasSelectionInBlock(editorState)) {
    return
  }

  onChange(CodeUtils.handlePastedText(editorState, text, html))
  return true
}

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

class GuildEditor extends React.Component {
  constructor (props) {
    super(props)

    const autolinker = new Autolinker({
      email: false,
      hashtag: false,
      mention: false,
      phone: false,
      urls: true
    })

    const decorator = new CompositeDecorator([
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
    ])

    const initContentState = ContentState.createFromText(belt.trimIndent(``))
    const initEditorState = EditorState.createWithContent(initContentState, decorator)

    this.state = {
      editorState: initEditorState,
      showColorPicker: true,
      showBlockBorders: true
    }
    this.onChange = (editorState) => {
      this.setState({editorState})
    }
    // Bind methods
    this.mergeBlockData = (blockData) => this._mergeBlockData(blockData)
    this.toggleBlockType = (blockType) => this._toggleBlockType(blockType)
    this.toggleInlineStyle = (style) => this._toggleInlineStyle(style)
    this.toggleInlineColor = (newHex) => this._toggleInlineColor(newHex)
    this.toggleInlineFont = (font) => this._toggleInlineFont(font)
    this.toggleInlineSize = (size) => this._toggleInlineSize(size)
    this.focus = () => this.refs.editor.focus()
  }

  _mergeBlockData (blockData) {
    const {editorState} = this.state
    const contentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()

    const newEditorState = EditorState.push(
      editorState,
      Modifier.mergeBlockData(contentState, selectionState, blockData),
      'change-block-data'
    )

    this.onChange(newEditorState)
  }

  _toggleBlockType (blockType) {
    console.log(`toggleBlockType`, blockType)
    this.onChange(
      RichUtils.toggleBlockType(
        this.state.editorState,
        blockType
      )
    )
  }

  _toggleInlineStyle (newStyle) {
    const newEditorState = RichUtils.toggleInlineStyle(
      this.state.editorState,
      newStyle
    )
    this.onChange(newEditorState)
  }

  // like toggleInlineStyle except it clears any other colors first
  _toggleInlineColor (newHex) {
    console.log(`toggleInlineColor] newHex=${newHex}`)
    const {editorState} = this.state
    const selectionState = editorState.getSelection()
    const currBlock = getCurrentBlock(editorState)
    const prevStyle = editorState.getCurrentInlineStyle()

    // If no selection, then we force it
    if (selectionState.isCollapsed()) {
      const styleAtCursor = currBlock.getInlineStyleAt()
      const newStyleSet = prevStyle.has(newHex)
        // user is trying to deselect the color
        ? styleAtCursor.remove(newHex)
        // else the user is picking a new one
        : styleAtCursor.add(newHex)
      // Save changes
      this.onChange(
        EditorState.setInlineStyleOverride(editorState, newStyleSet)
      )
      return
    }

    // Remove existing styles
    let newContentState = modifyInlineStyles(
      editorState.getCurrentContent(),
      selectionState,
      COLORS,
      false
    )

    // Add the color if they weren't trying to deselect it
    if (!prevStyle.has(newHex)) {
      newContentState = Modifier.applyInlineStyle(newContentState, selectionState, newHex)
    }

    // Update editor
    this.onChange(
      EditorState.push(editorState, newContentState, 'change-inline-style')
    )
  }

  // like toggleInlineStyle except it clears any other fonts first
  _toggleInlineFont (newKey) {
    const {editorState} = this.state
    const selectionState = editorState.getSelection()
    const prevStyle = editorState.getCurrentInlineStyle()
    // Clear fonts first
    let newContentState = FONTS.reduce((contentState, font) => {
      return Modifier.removeInlineStyle(contentState, selectionState, font.key)
    }, editorState.getCurrentContent())
    // Set font unless we already had it
    if (!prevStyle.has(newKey)) {
      newContentState = Modifier.applyInlineStyle(newContentState, selectionState, newKey)
    }
    // Update editor
    this.onChange(
      EditorState.push(editorState, newContentState, 'change-inline-style')
    )
  }

  _toggleInlineSize (newStyle) {
    const {editorState} = this.state
    const selectionState = editorState.getSelection()
    const prevStyle = editorState.getCurrentInlineStyle()
    // Clear all
    let newContentState = SIZES.reduce((contentState, {style}) => {
      return Modifier.removeInlineStyle(contentState, selectionState, style)
    }, editorState.getCurrentContent())
    // Set size unless we already had it
    if (newStyle !== 'M' && !prevStyle.has(newStyle)) {
      newContentState = Modifier.applyInlineStyle(newContentState, selectionState, newStyle)
    }
    // Update editor
    this.onChange(
      EditorState.push(editorState, newContentState, 'change-inline-style')
    )
  }

  render () {
    // const selectionState = this.state.editorState.getSelection()
    // const currentBlock = contentState.getBlockForKey(selectionState.getStartKey())

    const contentState = this.state.editorState.getCurrentContent()
    const jsonString = JSON.stringify(convertToRaw(contentState), null, 2)
    const currentBlock = getCurrentBlock(this.state.editorState)
    const currentStyle = this.state.editorState.getCurrentInlineStyle()
    const blockCount = this.state.editorState.getCurrentContent().getBlockMap().size

    let className = 'GuildEditor'
    if (this.state.showBlockBorders) {
      className = ' GuildEditor-showBlockBorders'
    }

    return (
      <div className={className}>
        {this.state.showColorPicker
            ? <ColorPicker
              currentStyle={this.state.editorState.getCurrentInlineStyle()}
              onToggle={this.toggleInlineColor}
              />
            : null
          }
        <Toolbar>
          <InlineStyleControls currentStyle={currentStyle} onToggle={this.toggleInlineStyle} />
          <HeaderStyleControls editorState={this.state.editorState} onToggle={this.toggleBlockType} />
          <AlignStyleControls currentAlign={currentBlock.getData().get('align')} onToggle={this.mergeBlockData} />
          <ListStyleControls currentBlock={currentBlock} onToggle={this.toggleBlockType} />
          {/* <SizeStyleControls editorState={this.state.editorState} onToggle={this.toggleInlineSize} /> */}
          <FontStyleControls currentStyle={currentStyle} onToggle={this.toggleInlineFont} />
          <HistoryControls editorState={this.state.editorState} onChange={this.onChange} />
          <SelectionDebug editorState={this.state.editorState} />
        </Toolbar>
        <div className='GuildEditor-editor' onClick={this.focus}>
          <Editor
            ref='editor'
            editorState={this.state.editorState}
            onChange={this.onChange}
            blockRenderMap={blockRenderMap}
            blockStyleFn={blockStyleFn}
            blockRendererFn={blockRendererFn}
            customStyleMap={styleMap}
            handleReturn={makeHandleReturn({onChange: this.onChange, getEditorState: () => this.state.editorState})}
            onTab={makeHandleTab({onChange: this.onChange, getEditorState: () => this.state.editorState})}
            keyBindingFn={makeKeyBindingFn({getEditorState: () => this.state.editorState})}
            handleKeyCommand={makeHandleKeyCommand({getEditorState: () => this.state.editorState, onChange: this.onChange})}
            handlePastedText={makeHandlePastedText({getEditorState: () => this.state.editorState, onChange: this.onChange})}
            placeholder=''
          />
        </div>
        <Footer
          blockCount={blockCount}
          showBlockBorders={this.state.showBlockBorders}
          onBlockBordersToggle={() => this.setState({showBlockBorders: !this.state.showBlockBorders})}
        />
        <pre>{jsonString}</pre>
      </div>
    )
  }
}

const Toolbar = (props) => {
  const {children, ...rest} = props
  return (
    <div className='Toolbar' {...rest}>
      {children}
    </div>
  )
}
Toolbar.propTypes = {
  children: PropTypes.node.isRequired
}

const Footer = (props) => {
  const {blockCount, onBlockBordersToggle, showBlockBorders} = props
  return (
    <Toolbar style={{color: 'white'}}>
      Block count: {blockCount}
      &nbsp;&mdash;&nbsp;
      <label style={{fontWeight: 'normal', cursor: 'pointer'}}>
        Show Block Borders:
        &nbsp;
        <input type='checkbox' onChange={onBlockBordersToggle} checked={showBlockBorders} />
      </label>
    </Toolbar>
  )
}
Footer.propTypes = {
  blockCount: PropTypes.number.isRequired,
  showBlockBorders: PropTypes.bool.isRequired,
  onBlockBordersToggle: PropTypes.func.isRequired
}

const SelectionDebug = (props) => {
  const onClick = (e) => {
    e.preventDefault()
    const {editorState} = props
    const selectionState = editorState.getSelection()
    const contentState = editorState.getCurrentContent()
    const contentBlock = contentState.getBlockForKey(selectionState.anchorKey)
    const info = selectionState.toJS()
    info.contentBlock = contentBlock.toJS()
    info.startOffset = selectionState.getStartOffset()
    info.endOffset = selectionState.getEndOffset()
    window.info = window
    window.block = contentBlock
    console.log(info)
  }
  return (
    <span onMouseDown={onClick} className='btn btn-default btn-xs'>
      Selection
    </span>
  )
}

/// /////////////////////////////////////////////////////////

const LIST_STYLES = [
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
  { label: 'Code', style: 'code-block', fa: 'code' }
]

class ListStyleControls extends React.PureComponent {
  static get propTypes () {
    return {
      currentBlock: PropTypes.object.isRequired,
      onToggle: PropTypes.func.isRequired
    }
  }

  render () {
    const {currentBlock} = this.props

    return (
      <div className='ListStyleControls'>
        <ButtonGroup>
          {LIST_STYLES.map(({label, style, fa}) => {
            const onMouseDown = (e) => {
              e.preventDefault()
              this.props.onToggle(style)
            }
            return (
              <Button
                key={style}
                onMouseDown={onMouseDown}
                active={currentBlock.getType() === style}
              >
                {fa ? <i className={`fa fa-${fa}`} /> : label}
              </Button>
            )
          })}
        </ButtonGroup>
      </div>
    )
  }
}

// ////////////////////////////////////////////////////////

const SIZES = [
  { label: 'XS', style: 'XS', fontSize: '60%' },
  { label: 'S', style: 'S', fontSize: '75%' },
  { label: 'M', style: 'M', fontSize: '100%' },
  { label: 'L', style: 'L', fontSize: '150%' },
  { label: 'XL', style: 'XL', fontSize: '250%' }
]

class SizeStyleControls extends React.PureComponent {
  static get propTypes () {
    return {
      editorState: PropTypes.object.isRequired,
      onToggle: PropTypes.func.isRequired
    }
  }

  render () {
    const currentStyle = this.props.editorState.getCurrentInlineStyle()
    return (
      <div className='SizeStyleControls'>
        <BtnGroup>
          {SIZES.map(({label, style}) => {
            const active = currentStyle.has(style) || (style === 'M' && !currentStyle.hasAny(['XS', 'S', 'L', 'XL']))
            return (
              <StyleButton
                key={style}
                label={label}
                onToggle={() => this.props.onToggle(style)}
                active={active}
              />
            )
          })}
        </BtnGroup>
      </div>
    )
  }
}

// ////////////////////////////////////////////////////////

// Fertigo: https://www.fonts.com/font/exljbris/fertigo?QueryFontType=Web&src=GoogleWebFonts
const FONTS = [
  // SAFE WEB FONTS
  { family: 'Times', full: '"Times New Roman", Times, serif' },
  { family: 'Comic Sans', full: '"Comic Sans MS", cursive, sans-serif' },
  { family: 'Courier', full: '"Courier New", Courier, monospace' }
  // GOOGLE
  // <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
  // { family: 'Lato', full: '"Lato", sans-serif' },
  // <link href="https://fonts.googleapis.com/css?family=Vollkorn" rel="stylesheet">
  // { family: 'Vollkorn', full: '"Vollkorn", serif' }
]
FONTS.forEach((font) => {
  font.key = font.family.toLowerCase().replace(/ /g, '-')
})

class FontStyleControls extends React.PureComponent {
  static get propTypes () {
    return {
      onToggle: PropTypes.func.isRequired,
      currentStyle: PropTypes.object.isRequired
    }
  }
  render () {
    const {currentStyle} = this.props
    return (
      <div className='FontStyleControls'>
        <ButtonGroup>
          {FONTS.map((font) => {
            const active = currentStyle.has(font.key)
            const onMouseDown = (e) => {
              e.preventDefault()
              this.props.onToggle(font.key)
            }
            return (
              <Button
                key={font.key}
                active={active}
                bsStyle={active ? 'primary' : 'default'}
                onMouseDown={onMouseDown}
                style={{fontFamily: font.full}}
              >
                {font.family}
              </Button>
            )
          })}
        </ButtonGroup>
      </div>
    )
  }
}

// ////////////////////////////////////////////////////////

const COLORS = [
  // Pastel
  'f7976a', 'f9ad81', 'fdc68a', 'fff79a',
  'c4df9b', 'a2d39c', '82ca9d', '7bcdc8',
  '6ecff6', '7ea7d8', '8493ca', '8882be',
  'a187be', 'bc8dbf', 'f49ac2', 'f6989d',
  // Full
  'ed1c24', 'f26522', 'f7941d', 'fff200',
  '8dc73f', '39b54a', '00a651', '00a99d',
  '00aeef', '0072bc', '0054a6', '2e3192',
  '662d91', '92278f', 'ec008c', 'ed145b',
  // Dark
  '9e0b0f', 'a0410d', 'a36209', 'aba000',
  '598527', '1a7b30', '007236', '00746b',
  '0076a3', '004b80', '003471', '1b1464',
  '440e62', '630460', '9e005d', '9e0039'
]

const COLOR_ROWS = arrayChunk(COLORS, 16)

const ColorSwatch = (props) => {
  const {x, y, side, active, hex} = props
  let styleMap = {
    backgroundColor: `#${hex}`,
    width: `${side}px`,
    height: `${side}px`
  }
  if (active) {
    styleMap = {
      ...styleMap,
      left: `${x * side - (x * 10) - 5}px`,
      top: `${y * side - (y * 10) - 5}px`
    }
  } else {
    styleMap = {
      ...styleMap,
      left: `${x * side}px`,
      top: `${y * side}px`
    }
  }
  let className = 'ColorPicker-colorSwatch'
  if (active) {
    styleMap['border'] = '3px solid black'
    className += ' ColorPicker-colorSwatch-active'
  }
  const onMouseDown = (e) => {
    e.preventDefault()
    props.onToggle()
  }
  return (
    <span
      className={className}
      style={styleMap}
      onMouseDown={onMouseDown}
    />
  )
}
ColorSwatch.propTypes = {
  hex: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  side: PropTypes.number.isRequired
}

class ColorPicker extends React.PureComponent {
  static propTypes = {
    // editorState: PropTypes.object.isRequired,
    currentStyle: PropTypes.object.isRequired,
    onToggle: PropTypes.func.isRequired
  }

  render () {
    // const currentStyle = this.props.editorState.getCurrentInlineStyle()
    const {currentStyle} = this.props

    return (
      <div className='ColorPicker'>
        {COLOR_ROWS.map((colors, y) => {
          return (
            <div key={colors[0]} className='ColorPicker-colorRow'>
              {colors.map((hex, x) => {
                const onToggle = () => this.props.onToggle(hex)
                const active = currentStyle.has(hex)
                const side = active ? 30 : 20
                return (
                  <ColorSwatch
                    key={hex}
                    hex={hex}
                    onToggle={onToggle}
                    active={active}
                    x={x}
                    y={y}
                    side={side}
                  />
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }
}

// ////////////////////////////////////////////////////////

const ALIGN_STYLES = [
  { label: 'Left', value: 'LEFT', fa: 'align-left' },
  { label: 'Center', value: 'CENTER', fa: 'align-center' },
  { label: 'Right', value: 'RIGHT', fa: 'align-right' },
  { label: 'Justify', value: 'JUSTIFY', fa: 'align-justify' }
]

class AlignStyleControls extends React.PureComponent {
  static get propTypes () {
    return {
      // editorState: PropTypes.object.isRequired,
      onToggle: PropTypes.func.isRequired,
      currentAlign: PropTypes.string
    }
  }

  render () {
    const {currentAlign} = this.props

    return (
      <div className='AlignStyleControls'>
        <BtnGroup>
          {ALIGN_STYLES.map((data) => {
            const active = currentAlign === data.value || (data.value === 'LEFT' && !currentAlign)
            const onToggle = active
              ? () => this.props.onToggle({ align: undefined })
              : currentAlign === 'LEFT'
                ? () => this.props.onToggle({ align: undefined })
                : () => this.props.onToggle({ align: data.value })
            return (
              <StyleButton
                key={data.label}
                onToggle={onToggle}
                active={active}
                fa={data.fa}
                label={data.label}
              >
                {data.label}
              </StyleButton>
            )
          })}
        </BtnGroup>
      </div>
    )
  }
}

// ////////////////////////////////////////////////////////

const HEADER_STYLES = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' }
]

class HeaderStyleControls extends React.PureComponent {
  static get propTypes () {
    return {
      editorState: PropTypes.object.isRequired,
      onToggle: PropTypes.func.isRequired
    }
  }

  render () {
    const contentState = this.props.editorState.getCurrentContent()
    const selectionState = this.props.editorState.getSelection()
    const currentBlock = contentState.getBlockForKey(selectionState.getStartKey())

    return (
      <div className='HeaderStyleControls'>
        <BtnGroup>
          {HEADER_STYLES.map((data) => {
            return (
              <StyleButton
                key={data.label}
                onToggle={() => this.props.onToggle(data.style)}
                active={currentBlock.getType() === data.style}
              >
                {data.label}
              </StyleButton>
            )
          })}
        </BtnGroup>
      </div>
    )
  }
}

// ////////////////////////////////////////////////////////

const HISTORY_ITEMS = [
  { label: 'Undo', key: 'UNDO', fa: 'undo' },
  { label: 'Redo', key: 'REDO', fa: 'repeat' }
]

const HistoryControls = (props) => {
  const {editorState, onChange} = props

  return (
    <div className='HistoryControls'>
      <BtnGroup>
        {HISTORY_ITEMS.map(({label, key, fa}) => {
          const onClick = (e) => {
            e.preventDefault()
            switch (key) {
              case 'UNDO': return onChange(EditorState.undo(editorState))
              case 'REDO': return onChange(EditorState.redo(editorState))
            }
          }
          return (
            <span key={key} onClick={onClick} className='btn btn-default btn-sm'>
              <i className={`fa fa-${fa}`} /> {label}
            </span>
          )
        })}
      </BtnGroup>
    </div>
  )
}

HistoryControls.propTypes = {
  editorState: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}

// ////////////////////////////////////////////////////////

const INLINE_STYLES = [
  { label: 'Bold', style: 'BOLD', fa: 'bold' },
  { label: 'Italic', style: 'ITALIC', fa: 'italic' },
  { label: 'Underline', style: 'UNDERLINE', fa: 'underline' },
  { label: 'Strike', style: 'STRIKE', fa: 'strikethrough' }
]

const InlineStyleControls = (props) => {
  const {currentStyle} = props
  return (
    <div className='InlineStyleControls'>
      <BtnGroup>
        {INLINE_STYLES.map((data) => {
          return (
            <StyleButton
              key={data.label}
              onToggle={() => props.onToggle(data.style)}
              active={currentStyle.has(data.style)}
              fa={data.fa}
            >
              {data.label}
            </StyleButton>
          )
        })}
      </BtnGroup>
    </div>
  )
}

InlineStyleControls.propTypes = {
  currentStyle: PropTypes.instanceOf(I.OrderedSet).isRequired,
  onToggle: PropTypes.func.isRequired
}

// ////////////////////////////////////////////////////////

const styleMap = {}

styleMap['STRIKE'] = {
  textDecoration: 'line-through'
}

COLORS.forEach((hex) => {
  styleMap[hex] = { color: `#${hex}` }
})

FONTS.forEach((font) => {
  styleMap[font.key] = { fontFamily: font.full }
})

SIZES.forEach(({style, fontSize}) => {
  styleMap[style] = { fontSize }
})

// ////////////////////////////////////////////////////////

export default GuildEditor
