import React, { useEffect, useState, useCallback, useRef } from 'react'
import _ from 'lodash'
import Main from './main'
import Nav from './nav'
import Outline from './outline'
import ActionPanel from './action-panel'
import classnames from 'classnames'
import css from '../css/index'
import { initStore, getStore } from 'edata-store'
import { SettingProvider } from './context/settings'
import { getUserInfo, prefix, NewID } from '../methods/util'
import 'long-press-event/dist/long-press-event.min.js'
import {ConfigProvider} from 'antd'
import zhCN from 'antd/es/locale/zh_CN'
import { centerNode, mindMapStyle, clearNullChildren } from '../methods/node-util'
import * as life from 'react-life-hooks'
    // import data from '../statics/rmind.json'

import { message } from 'antd';
(window as any).asdf = initStore(null, {});
const eStatus = (window as any).es = initStore('status', {
    cur_edit: '',  // 当前编辑节点ID
    new_node: '',  // 新建节点的标识
    cur_select: '',  // 当前选中节点ID
    selected_comment: '',  // 需展现的评论
    selectId: [],  // 参数传入的选中高亮ID
    showOutline: false,
    quickAddMode: true,
    cur_change: {},
    showActionPanel: false, // 右侧面板显示隐藏
    tab: '', // 右侧tab切换
    order: false,
})

// 协作状态
const coop = (window as any).coop = initStore('coop', {
    cur_select: {}
})


let hide = false

const App = (props) => {
    const [loading, setLoading] = useState(true)

    useEffect(() => {

        let isUnmount = false

        const getMapData = () => {
            props.login.isLogin().then((res) => {
                const userInfo = getUserInfo()
                const { isLogin } = res.body.data
                if (isLogin === false || !userInfo) {
                    props.history.push(`${prefix}/login?from=${encodeURIComponent(location.href)}`)
                } else {
                    const { id } = props.routeParams || {}
                    const isAll = false // props.location.pathname === `${prefix}/all`
                    if (id) {
                        props.mindmap.getMindMap(null, { id }).then(res => {
                            if (res.body.errors) {
                                alert(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                                props.history.push(`${prefix}/`)
                            }
                            const { xjson, _timestamp } = res.body.data.attributes
                            const json = clearNullChildren(JSON.parse(xjson))
                            if (json) {
                                const newNode = { children: [], ...json, id: res.body.data.id }
                                _.set(newNode, 'meta._timestamp', _timestamp)
                                const {readOnly} = props.location.query || {}
                                if(readOnly) {
                                    _.set(newNode, 'attrs.readOnly', true)
                                }
                                getStore().set(newNode)
                                const selectId = _.get(props.location, 'query.selectId', '')
                                const selectedComment = _.get(props.location, 'query.selectedComment', '')
                                const selectedIdArray = selectId.split(',')
                                eStatus.set('cur_select', selectedIdArray[0] || newNode.id)
                                eStatus.set('selectId', selectedIdArray)
                                eStatus.set('selected_comment', selectedComment)
                                if(selectedComment) {
                                    setTimeout(()=>{
                                        eStatus.set('tab', 'comment')
                                        eStatus.set('showActionPanel', true)
                                    })
                                } else if(selectId) {
                                    setTimeout(()=>{
                                        eStatus.set('tab', 'task')
                                        eStatus.set('showActionPanel', true)
                                    })
                                }
                                if (!isUnmount) {
                                    document.title = `${newNode.text}`
                                    setLoading(false)
                                }
                            }

                        }).catch(err=>{
                            message.error(err.message)
                        })
                    } else {
                        Promise.all([
                        props.mindmap.getMindMapList(isAll ? null : {
                            'filter[xauthor]': `"${userInfo.xusername}"`,
                            sort: '>createAt',
                        }), props.mindmap.getMindMapList(isAll ? null : {
                            'filterp[xcopyPerson]': `${userInfo.id}`,
                            sort: '>createAt',
                        }), props.mindmap.getMindMapList(isAll ? null : {
                            'filterp[xchargePerson]': `${userInfo.id}`,
                            sort: '>createAt',
                        })]).then(([resMyMap, resCopyToMe, resChargeByMe]) => {
                            if(!resMyMap.ok || !resCopyToMe.ok || !resChargeByMe.ok) {
                                return message.error('读取数据错误')
                            }
                            const childrenData = resMyMap.body.data
                            const data = childrenData.map(item => {
                                const json = clearNullChildren(JSON.parse(item.attributes.xjson))
                                const { children = [], ...rest } = json
                                return {
                                    ...rest,
                                    attrs: {
                                        ...rest.attrs,
                                        submap: {
                                            ...(rest.attrs || {}).submap,
                                            id: item.id
                                        },
                                        // readOnly: true
                                    },
                                    id: item.id,
                                    children: children.slice().map(v => {
                                        return {
                                            ...v,
                                            id: NewID(),
                                        }
                                    })
                                }
                            })

                            const copyToMe = (resCopyToMe.body.data || []).map(item=>{
                                const json = JSON.parse(item.attributes.xjson)
                                const {xcopyPerson = []} = item.attributes
                                const { children = [], ...rest } = json
                                return {
                                    ...rest,
                                    attrs: {
                                        ...rest.attrs,
                                        submap: {
                                            ...(rest.attrs || {}).submap,
                                            id: item.id
                                        },
                                        readOnly: true,
                                        copyInfo: xcopyPerson.find(v=>v.id === userInfo.id)
                                    },
                                    id: NewID(),
                                    children: children.slice().map(v => {
                                        return {
                                            ...v,
                                            id: NewID(),
                                        }
                                    })
                                }
                            })

                            const chargeByMe = (resChargeByMe.body.data || []).map(item=>{
                                const json = JSON.parse(item.attributes.xjson)
                                const {xchargePerson = []} = item.attributes
                                const { children = [], ...rest } = json
                                return {
                                    ...rest,
                                    attrs: {
                                        ...rest.attrs,
                                        submap: {
                                            ...(rest.attrs || {}).submap,
                                            id: item.id
                                        },
                                        readOnly: true,
                                        chargeInfo: xchargePerson.find(v=>v.id === userInfo.id)
                                    },
                                    id: NewID(),
                                    children: children.slice().map(v => {
                                        return {
                                            ...v,
                                            id: NewID(),
                                        }
                                    })
                                }
                            })

                            const mindMapData = {
                                id: NewID(),
                                text: '我的',
                                showChildren: true,
                                children: [
                                    {
                                        id: NewID(),
                                        text: '脑图',
                                        showChildren: true,
                                        children: data.filter(v=>!v.attrs.submap.parent)
                                    },
                                    {
                                        id: NewID(),
                                        text: '协同',
                                        showChildren: true,
                                        attrs: {
                                            readOnly: true
                                        },
                                        children: chargeByMe
                                    },
                                    {
                                        id: NewID(),
                                        text: '子任务',
                                        showChildren: true,
                                        attrs: {
                                            readOnly: true
                                        },
                                        children: data.filter(v=>v.attrs.submap.parent)
                                    },
                                    {
                                        id: NewID(),
                                        text: '抄送',
                                        showChildren: true,
                                        attrs: {
                                            readOnly: true
                                        },
                                        children: copyToMe
                                    },
                                ]
                            }
                            const rootData = { id: NewID(), children: [], ...mindMapData }
                            getStore().set(rootData)
                            eStatus.set('rootData', eStatus.of(rootData))
                            eStatus.set('cur_select', rootData.id)
                            if (!isUnmount) {
                                document.title = '我的脑图'
                                setLoading(false)
                            }
                        }).catch(err=>{
                            message.error(err.message)
                        })

                    }
                }
            })
        }
        setLoading(true)
        getMapData()
        return () => {
            isUnmount = true
        }
    }, [location.href])

    if (loading) {
        return 'loading'
    }
    return <SettingProvider>
        <ConfigProvider locale={zhCN}>
            <div className={css.app}>
                <Nav {...props}></Nav>
                <div className={classnames(css['content-wrapper'])}>
                    <Outline {...props}></Outline>
                    <Main {...props}></Main>
                    <ActionPanel {...props}></ActionPanel>
                </div>
            </div>
        </ConfigProvider>
    </SettingProvider>
}

export default App
