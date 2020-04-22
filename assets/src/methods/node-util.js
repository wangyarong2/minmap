import { getStore, initStore } from 'edata-store'
import _ from 'lodash'
import { Modal } from 'antd'
import css from '../css'
import { NewID, getUserInfo, unwrapEdata } from './util'
import { deepCopy, findNode } from './assist-functions'
export const node_refs = new Set()
window.node_refs = node_refs

const { confirm } = Modal
const { isArray } = Array

export const DEFAULT_TIME_UNIT = 'h'

export const NODE_TASK_STATUS = {
  NOSTART: '未开始',
  ONGOING: '进行中',
  FINISHED: '已完成',
}

export let mindMapStyle = initStore('mindMapStyle', {
  transform: {
    scale: 1,
    translateX: 0,
    translateY: 0
  }
}).proxy()

export function closest(value) {
  if (value.closest() && value.closest().closest()) {
    return value.closest().closest().proxy()
  }
  return value.root.proxy()
}

export function getClosestAuthor(data) {
  const node = data.__isEdata__ ? data : data.__edata__
  const author = node.unwrap('attrs.tasks.director')
  if (author) {
    return author
  }
  if (node === node.root) {
    return
  }
  const parentNode = node.closest() && node.closest().closest()
  return getClosestAuthor(parentNode || node.root)
}

export function isCurrentNodeReadOnly(node){
  const isUserCharge = _.get(node, 'attrs.tasks.director.key') === getUserInfo().id
  if(isUserCharge) {
    return false
  }
  const queryReadOnly = new URL(location.href).searchParams.get('readOnly')
  if(queryReadOnly) return true
  if(!node) {
    var nodeInfo = getNodeById(getStore('status').unwrap('cur_select'))
    node = (nodeInfo || {}).node
  }
  if(!node) {
    return true
  }
  const parents = getParentNodes(node)
  let readOnly = [node].concat(parents).some(v=>_.get(v, 'attrs.readOnly'))
  return readOnly
}

export function getParentNodes(data) {
  if(!data) return []
  const node = data.__isEdata__ ? data : data.__edata__
  const arr = []
  let parentNode = node
  while (parentNode = parentNode.closest() && parentNode.closest().closest()) {
    arr.push(parentNode.proxy())
  }
  arr.push(node.root.proxy())
  return arr
}

export function centerNode(node, nodeBoundingClientRect, noBlink) {
  let nodeInfo = getNodeById(
    node ? node.id : getStore('status').unwrap('cur_select') || getStore().unwrap('id')
  )
  const { ref } = nodeInfo || {}
  if (ref && ref.current) {
    const rect = nodeBoundingClientRect || ref.current.getBoundingClientRect()
    const diffY = rect.y - window.innerHeight / 2 + rect.height / 2
    const diffX = rect.x - window.innerWidth / 2 + rect.width / 2
    mindMapStyle.transform.translateX -= diffX / (mindMapStyle.transform.scale)
    mindMapStyle.transform.translateY -= diffY / (mindMapStyle.transform.scale)
    !noBlink && ref.current.classList.add(css.blink_me)
  }
}

export function toggleNode(node) {
  const nodeInfo = getNodeById(node.id) || {}
  const { ref } = nodeInfo
  if (ref && ref.current) {
    nodeInfo.rect = ref.current.getBoundingClientRect()
  }
  const nodeStatus = getStore('status')
  nodeStatus.set('cur_select', node.id)
  if (!node.showChildren) {
    node.showChildren = true
    node.hideChildren = false
  } else {
    node.hideChildren = !node.hideChildren
    // node.showChildren = false
  }

  nodeStatus.set('cur_change', {
    type: 'toggle',
    nodeId: node.id,
  })
  // 避免出现当前选择的节点被隐藏后仍然可以操作的情况
  // getStore('status').set('cur_select', '')
}

export function addChild(node, newNode) {
  if(isCurrentNodeReadOnly(node)) {
    return
  }
  const id = NewID()
  const {children = []} = node
  newNode = newNode || {
    id,
    text: '新节点' + (children.length || ''),
    children: [],
    meta: {},
    type: 'form_mindmap',
  }
  _.set(newNode, 'attrs.creator', getUserInfo())
  _.isArray(node.children) && node.children.push(newNode)

  node.showChildren = true
  node.hideChildren = false
  const nodeStatus = getStore('status')
  nodeStatus.set('cur_select', newNode.id)
  nodeStatus.set('cur_edit', newNode.id)
  nodeStatus.set('new_node', newNode.id)
  return _.last(node.children)
}

export function selectOtherNode(node, other) {
  if (!node || !node.id) return
  const eNode = node.__edata__
  const eChildren = eNode.closest()
  const nodeStatus = getStore('status')
  if (other === 'prev') {
    if (!eChildren) return
    const children = eChildren.proxy()
    if(!children) return
    const index = children.findIndex(v => v.id == node.id)
    const cur_select = (children[index - 1] || {}).id || ''
    if (cur_select) {
      return nodeStatus.set('cur_select', cur_select)
      // nodeStatus.set('select_by_click', false)
    }
  }
  if (other === 'next') {
    if (!eChildren) return
    const children = eChildren.proxy()
    const index = children.findIndex(v => v.id == node.id)
    const cur_select = (children[index + 1] || {}).id || ''
    if (cur_select) {
      return nodeStatus.set('cur_select', cur_select)
      // nodeStatus.set('select_by_click', false)
    }
  }
  if (other === 'children') {
    if (node.children.length > 0) {
      const isHideChildren = node.hideChildren || !node.showChildren
      if (isHideChildren) return
      let selectedIndex = eNode.unwrap('meta.selectedIndex') | 0
      // console.log(node.id, selectedIndex)
      selectedIndex = Math.min(Math.max(selectedIndex, 0), node.children.length)
      return nodeStatus.set('cur_select', node.children[selectedIndex].id)
      // nodeStatus.set('select_by_click', false)
    }
  }
  if (other === 'parent') {
    if (!eChildren) return
    const eParent = eChildren.closest() || eChildren.root
    if (eParent) {
      return nodeStatus.set('cur_select', eParent.get('id'))
      // nodeStatus.set('select_by_click', false)
    }
  }
}

export function deleteNode(node, shouldConfirm) {
  if(isCurrentNodeReadOnly(node)) {
    return
  }
  const action = () => {
    const eChildren = node.__edata__.closest()
    if (!eChildren) return
    const children = eChildren.proxy()
    if(!children) return
    const index = children && children.findIndex(v => v && v.id == node.id)
    // console.log('index', children, node, index)
    if (index > -1) {
      children.splice(index, 1)
      if (!selectOtherNode(node, 'next')) {
        selectOtherNode(node, 'parent')
      }
    }
  }
  if (shouldConfirm) {
    confirm({
      title: '此节点下所有节点将被删除，确认删除吗?',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        action()
      },
    })
  } else {
    action()
  }
}

export function addSibling(node, newNode) {
  const parent = node.__edata__.closest()
  if (!parent) return
  if(isCurrentNodeReadOnly(parent)) {
    return
  }
  const id = NewID()
  const {children = []} = node

  newNode = newNode || {
    id,
    text: '新节点' + (children.length || ''),
    children: [],
    meta: {},
    type: 'form_mindmap',
  }
  _.set(newNode, 'attrs.creator', getUserInfo())
  parent.push(newNode)
  const nodeStatus = getStore('status')
  nodeStatus.set('cur_select', newNode.id)
  nodeStatus.set('cur_edit', newNode.id)
  nodeStatus.set('new_node', newNode.id)
  return _.last(parent.proxy())
}

export function getNodeById(id) {
  for (let d of Array.from(node_refs).reverse()) {
    if (d.node.id === id) return d
  }
}

export function walkTree(tree, options = {}) {
  const { callback } = options
  if (callback && !isArray(tree)) {
    if (callback(tree) === false) {
      return false
    }
  }
  const children = isArray(tree) ? tree : tree.children
  if (isArray(children)) {
    children.some(v => {
      return walkTree(v, options) === false
    })
  }
}

export function getNodeUsers({node, includeRoot} = {}) {
  if(!node) return []
  const director = _.get(node, 'attrs.tasks.director')
  const tester = _.get(node, 'attrs.tasks.tester')
  const copyPerson = _.get(node, 'attrs.tasks.copyPerson', [])
  let arr = []
  if(!_.isEmpty(director)) {
    arr.push(director)
  }
  if(!_.isEmpty(tester)) {
    arr.push(tester)
  }
  if(!_.isEmpty(copyPerson)) {
    arr.push(...copyPerson)
  }
  if(includeRoot) {
    arr.push(...getNodeUsers({node: node.__edata__.root.proxy()}))
  }
  return _.uniqBy(arr, v=>v.key)
}

export function flatNodes(tree, options = {}) {
  const { store = [], end } = options || {}
  options = Object.assign({ store }, options)
  const { children, ...props } = tree
  const len = store.length
  if (end != null && len > end) {
    return [store, true]
  }
  store.push(props)
  if (children) {
    children.some(v => {
      if(!v) return
      const [store, isEnd] = flatNodes(v, options)
      return isEnd
    })
  }
  return [store]
}

export function clearNullChildren(tree, options = {}) {
  const { store = [], end } = options || {}
  options = Object.assign({ store }, options)
  let { children, ...props } = tree
  const len = store.length
  if (end != null && len > end) {
    return [store, true]
  }
  if (children) {
    tree.children = children = children.filter(v=>v && v.id)
    children.some(v => {
      clearNullChildren(v, options)
    })
  }
  return tree
}

export function getTransformStyle(object) {
  const defaultUnits = {
    perspective: 'px',
    translateX: 'px',
    translateY: 'px',
    skewX: 'deg',
    skewY: 'deg',
    rotateX: 'deg',
    rotateY: 'deg'
  }
  return Object.keys(object)
    .map(prop => {
      const value = object[prop] + (defaultUnits[prop] || '')
      return `${prop}(${value})`
    })
    .join(' ')
}
// console.log(getTransformStyle({scale:1, translateX:2.5}))

export function moveNode(node_id, target_id, parent_id, is_sibling) {
  const eStatus = getStore('status')
  const node = node_id && getNodeById(node_id).node
  if(!node_id || !node) {
    return
  }
  const nodeData = node && node.__edata__
  const parent = closest(nodeData)
  const node_index = parent.children.findIndex(node => node.id === node_id)
  const node_copy = parent.children[node_index]
  if (is_sibling) {
    if(isCurrentNodeReadOnly(parent)) {
      return
    }
    parent.children.splice(node_index, 1);
    const target_index = parent.children.findIndex(node => node.id === target_id) + 1 || parent.children.length + 1;
    parent.children.splice(target_index - 1, 0, node_copy);
  } else {
    const target_node = getNodeById(target_id).node
    if(isCurrentNodeReadOnly(target_node)) {
      return
    }
    parent.children.splice(node_index, 1);
    target_node.children.push(node_copy);
    target_node.showChildren = true
  }
  eStatus.set('cur_select', target_id || node_id)
}

export function orderChildrenListNumber(node) {
  const edataStatus = getStore('status')
  const order = edataStatus.get('order')
  node && _.isArray(node.children) && node.children.map((val, index) => {
    const reg = /^\<\d{1,}\>/
    if (order.value && !reg.test(val.text)) {
      _.set(val, 'attrs.sorting', `<${index + 1}>`)
    }
    if (!order.value) {
      _.set(val, 'attrs.sorting', ``)
    }
  })
}


export function orderChildrenListLevel(node) {
  const nodeData = node.__edata__
  const parentData = closest(nodeData)
  _.isArray(parentData.children) && parentData.children.sort(function (a, b) {
    // order是规则  objs是需要排序的数组
    const order = ["HIGH", "MIDDLE", "LOW", '']
    const aLevel = _.get(a.proxy(), 'attrs.tasks.level', '')
    const bLevel = _.get(b.proxy(), 'attrs.tasks.level', '')
    return order.indexOf(aLevel) - order.indexOf(bLevel)
  })
  orderChildrenListNumber(parentData)
}


// 撤销
export function handleUndoAction() {
  if (historyIndex < 0) {
    return console.log('no history')
  }
  const mindmap = getStore()
  const { type, path, value, oldValue } = historyArray[historyIndex--]
  mindmap.observer.meta.history = true
  if (type === 'add') {
    mindmap.unset(path)
  }
  if (type == 'update') {
    mindmap.set(path, oldValue, { meta: { history: true } })
  }

  if (type == 'delete') {
    const leaf = path.slice(-1)
    const tree = path.slice(0, -1)
    mindmap.get(tree).splice(Number(leaf), 0, value)
  }
  mindmap.observer.meta.history = false
}

// 恢复
export function handleRedoAction() {
  if (historyIndex >= historyArray.length - 1) {
    return console.log('no history')
  }
  const mindmap = getStore()
  const { type, path, value, oldValue } = historyArray[++historyIndex]
  mindmap.observer.meta.history = true
  if (type === 'add') {
    mindmap.set(path, value)
  }
  if (type == 'update') {
    mindmap.set(path, value, { meta: { history: true } })
  }

  if (type == 'delete') {
    const leaf = path.slice(-1)
    const tree = path.slice(0, -1)
    mindmap.get(tree).splice(Number(leaf), 1)
  }
  mindmap.observer.meta.history = false
}


var historyArray = []
export var historyIndex = -1
window.h = {
  historyArray,
  handleUndoAction
}
export function handleUndoList(e) {
  const { path, type, data, meta } = e
  const value = unwrapEdata(data)
  const oldValue = meta.oldData
  if (type === 'update' && (value === oldValue || !oldValue) ||
    path.indexOf('attrs') > 0 ||
    /,meta,selectedIndex$/.test(path) ||
    /,showChildren$/.test(path) ||
    /,hideChildren$/.test(path)
  ) {
    return
  }

  historyArray[++historyIndex] = { type, path, value, oldValue }
  if (historyArray.length > historyIndex + 1) {
    historyArray.splice(historyIndex + 1)
  }
}

