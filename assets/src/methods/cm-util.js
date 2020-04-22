import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/addon/search/searchcursor'
import 'codemirror/addon/search/search'
import '../css/cm-style.less'
import { getStore } from 'edata-store'
import { edataProxy } from 'edata'
import { NewID } from './util'

export function defineMode() {
  CodeMirror.defineMode('mindmap', function (config, parserConfig) {
    const { tabSize } = config
    return {
      token: (stream, state) => {
        var m
        if (stream.sol()) {
          if (stream.match(/^\S/)) {
            stream.skipToEnd()
            return 'line-cm-level0'
          }
          if ((m = stream.match(/^\s+/))) {
            stream.skipToEnd()
            // check empty line
            if (m[0].length === stream.pos) {
              return
            }
            return 'line-cm-level' + ((stream.indentation() / tabSize) | 0)
          }
        } else {
          stream.skipToEnd()
          return 'null'
        }
        stream.skipToEnd()
        return 'error'
      },
      blankLine: function (state) { },
      startState: function () {
        return { state: 'top', type: null }
      }
    }
  })
}

const tabSize = 2
export const initEditor = (dom, value) => {
  if (!dom) return
  defineMode()
  const cm = CodeMirror(dom, {
    tabSize,
    // indentWithTabs: true,
    lineWrapping: true,
    styleActiveLine: true,
    lineNumbers: false,
    mode: 'mindmap',
    value,
  })
  cm.addOverlay({
    token: stream => {
      const { pos, string } = stream
      if ((pos === 0 || /^\s+$/.test(string.substring(0, pos))) && stream.match(/^\t|^  /)) {
        return 'ig ig' + pos
      } else {
        stream.skipToEnd()
      }
    }
  })
  return cm
}

// view-source:https://codemirror.net/demo/indentwrap.html
export function drawGuideLine(editor) {
  var charWidth = editor.defaultCharWidth(), basePadding = 4;
  editor.on("renderLine", function (cm, line, elt) {
    var off = CodeMirror.countColumn(line.text, null, cm.getOption("tabSize")) * charWidth;
    elt.style.textIndent = "-" + off + "px";
    elt.style.paddingLeft = (basePadding + off) + "px";
  });
  editor.refresh();
}

export function getOutlineContent() {
  const eNodes = getStore()
  const data = eNodes.unwrap()
  const tree = []
  const getTree = (node, level = 0) => {
    if (!node) return
    tree.push('\t'.repeat(level) + node.text)
      ; (node.children || []).forEach(v => getTree(v, level + 1))
  }
  data.children.forEach(v => getTree(v))
  return tree
}

function syncNodeMetaData(enodeChildren, index, root) {
  root = root || getStore()
  const obj = enodeChildren.get(index)
  const d = root.get(enodeChildren.path.concat(index))
  if (d) {
    obj.set('showChildren', d.unwrap('showChildren'))
    obj.set('hideChildren', d.unwrap('hideChildren'))
    obj.set('meta', d.unwrap('meta'))
  }
  return obj
}

export function outlineToTree(text) {
  const arr = text.split('\n')
  const data = edataProxy({
    children: [],
  })
  let children = data.children
  let prevLevel = 0
  arr.forEach((line, i) => {
    const [_, pre = '', text = ''] = line.match(/^([ \t]+)?(.*)$/) || []
    if (!text) return
    let level = pre.replace(/\t/g, '  ').length / 2
    if (Math.floor(level) !== level) {
      throw new Error(`error indent: [line ${i}] ${line}`)
    }
    const obj = {}
    obj.id = NewID()
    obj.text = text
    obj.children = []
    obj.meta = {}
    if (prevLevel === level) {
      children.push(obj)
    } else if (prevLevel < level) {
      level = prevLevel + 1
      children = children[children.length - 1].children
      children.push(obj)
    } else if (prevLevel > level) {
      let back = prevLevel - level
      let c = children.__edata__
      while (back--) {
        c = c.closest().closest('children')
      }
      children = c.proxy()
      children.push(obj)
    }
    syncNodeMetaData(children.__edata__, children.length - 1)
    prevLevel = level
  })
  return data.children.__edata__.unwrap()
}

