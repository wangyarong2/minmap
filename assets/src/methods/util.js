import {getClosestAuthor} from './node-util'

import isMobileJS from 'ismobilejs'
import { getStore } from 'edata-store'

export const isMobile = isMobileJS()

const inputTags = ['INPUT', 'TEXTAREA']
export function isInputActive() {
    return document.activeElement != null && inputTags.includes(document.activeElement.tagName)
}

export function generateShareLink(){
  const id = getStore('status').unwrap('cur_select')
  const urlObj = new URL(location.href)
  urlObj.searchParams.set('selectId', id)
  const link = urlObj+''
  return link
}

export const {prefix} = window.CONFIG

var GLOBAL_COUNT=0
export function NewID () {
  GLOBAL_COUNT++
  return (Date.now()+Math.random()).toString(36).replace('.', GLOBAL_COUNT.toString(36))
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export function isValidUUIDV4 (uuid) {
  return uuidRegex.test(uuid)
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [value]
}

export function pathStartsWith(pathname, checkStr) {
  return pathname.startsWith(checkStr + '/') || pathname=== checkStr
}

export function mergeJSONAPIDataItem(dataItem = {}) {
  const {attributes, ...rest} = dataItem
  return {...rest, ...attributes}
}

export const unwrapEdata = value => {
  return value && value.__isEdata__
    ? value.unwrap ? value.unwrap() : value.value
    : value
}

export function getUserInfo(){
  let userInfo
  try {
    userInfo = JSON.parse(localStorage.getItem('userinfo'))
  }catch(e){}
  return userInfo
}

export const getAuthor = (value) => {
  const director = getClosestAuthor(value) || {}
  const loginUser = getUserInfo() || {}
  const xauthor = {
      id: director.key || loginUser.id,
      type: 'form_mindUser'
  }
  return xauthor
}

export function diffNodes(arr1, arr2, {id = 'id'} = {}) {
  const mapA = {}
  const mapB = {}
  const a = arr1.map(v=>{
    mapA[v[id]] = v
    return v[id]
  })
  const b = arr2.map(v=>{
    mapB[v[id]] = v
    return v[id]
  })
  const added = _.difference(a, b)
  const removed = _.difference(b, a)
  const changed = _.intersection(a, b).filter(id=>{
    return !_.isEqual(mapA[id], mapB[id])
  })
  return {added, removed, changed}
}
