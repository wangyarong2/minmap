import React, { useRef, useEffect, useLayoutEffect, useCallback, useState } from 'react'
import classnames from 'classnames'
import { getStore } from 'edata-store'
import * as life from 'react-life-hooks'
import * as refer from '../statics/refer'
import InputDiv from './input'
import { Divider, Badge, Tag } from 'antd'
import _ from 'lodash'
import css from '../css/index'
import { handlePropagation } from '../methods/assist-functions'
import { toggleNode, getNodeById, mindMapStyle, deleteNode, handleUndoList, addChild, getParentNodes, isCurrentNodeReadOnly, DEFAULT_TIME_UNIT } from '../methods/node-util'
import moment from 'moment'
import { app } from '../index'
import ToolButton from './tool-button'
import { prefix, unwrapEdata, isMobile, getUserInfo, ensureArray } from '../methods/util'
import { createWebSocket } from './ws'

const Node = (props) => {
    const { layer, node, parent, node_refs, on_left = false, mindmap, routeParams } = props
    const redraw = life.useRedraw()
    const self = useRef<any>()
    const eStatus = getStore('status')
    const coopStatus = getStore('coop').proxy()
    const nodeStatus: any = eStatus.proxy()
    const curSelectUserArray = _.get(coopStatus, ['cur_select', node.id], [])
    
    useEffect(() => {
        let { id } = routeParams
        let ws
        const userInfo = getUserInfo()
        const hasWs = id && layer === 0 && userInfo
        if (hasWs) {
            ws = (window as any).ws = createWebSocket({ id, query: {userInfo} })
            ws.addEventListener('message', (e) => {
                const mindmap = getStore()
                const eNode = node.__edata__
                if (!eNode) {
                    return
                }
                const data = JSON.parse(e.data)
                if(data.id !== id) {
                    return
                }
                mindmap.observer.meta.ws = true
                switch (data.type) {
                    case 'mm:node_status': {
                        const prevSelectState = coopStatus.cur_select || {}
                        Object.assign(coopStatus, data.payload)
                        // const {cur_select, prev_select, userInfo = {}} = data.inPayload || {}
                        // let checkId = [cur_select, prev_select]
                        // _.some(prevSelectState, (arr, id)=>{
                        //     if(arr.findIndex(v=>v.id === userInfo.id) > -1) {
                        //         checkId.push(id)
                        //         return true
                        //     }
                        // })
                        // coopStatus.cur_select_array = checkId
                        break
                    }
                    case 'mm:node_patch': {
                        console.log(data.payload, 9999)
                        if(layer===0) {
                            const { toSave } = data.payload
                            Object.assign(mindmap.proxy(), toSave)
                            redraw()
                        }
                        break
                    }
                    case 'mm:comment_update': {
                        coopStatus.comment_update = data.payload
                        break
                    }
                    case 'mm:node_action': {

                        const xjson = eNode
                        const {type, path, value, nodeId} = data.payload
                        const [leaf] = path.slice(-1)
                        const tree = path.slice(0, -1)
                        // array operation
                        if(_.last(tree) === 'children' && !isNaN(leaf) && leaf !== '') {
                            const invalid = false // type === 'delete' && nodeId && xjson.unwrap(path.concat('id')) != nodeId
                            if(!invalid) {
                                let parent = xjson.get(tree)
                                if(!parent) {
                                    parent = xjson.set(tree, [])
                                }
                                parent = parent.proxy()
                                if(type==='delete') {
                                    parent.splice(leaf, 1)
                                } else if(type === 'add') {
                                    parent.splice(leaf, 0, value)
                                } else {
                                    parent[leaf] = value
                                }
                            } else {
                                console.log('invalid action:', type, path, nodeId)
                            }
                        } else {
                            if(type==='delete') {
                                xjson.unset(path)
                            } else {
                                xjson.set(path, value)
                            }
                        }

                        break
                    }
                    case 'mm:node_delete': {
                        const { id } = data.payload
                        let deleted = eStatus.get('deleted')
                        if (!deleted) {
                            deleted = eStatus.set('deleted', [])
                        }
                        deleted.push(id)
                        alert('此脑图已被删除，将无法被保存')
                        break
                    }
                }
                mindmap.observer.meta.ws = false
            })

            const eNodeStatus = getStore('status')
            var unwatchStatus = eNodeStatus.watch(e => {
                if (/^cur_select$/.test(e.path.join())) {
                    ws.sendMsg({ type: 'mm:node_status', payload: { cur_select: e.data.unwrap(), prev_select: e.meta.oldData, userInfo }, uid: ws.uid, id })
                }
            })
        }
        const unwatch = node.__edata__ && node.__edata__.watch(e => {
            if (e.path[0] === 'meta' || _.last(e.path) === 'meta') {
                return
            }
            if(/children,\d+$/.test(e.path) && !e.data.value) {
                console.log(e, 999)
                debugger
            }
            if (ws && e.meta.ws !== true) {
                const { path, type, data, meta } = e
                const value = data.unwrap()
                const oldValue = meta.oldData
                if (type === 'update' && (value === oldValue) ||
                    // path.indexOf('attrs') > 0 ||
                    /,meta,selectedIndex$/.test(path)
                    // /,showChildren$/.test(path) ||
                    // /,hideChildren$/.test(path)
                ) {
                    return
                }
                ws.sendMsg({ type: 'mm:node_action', payload: { path, type, value, nodeId: eStatus.unwrap('cur_select') }, uid: ws.uid, id })
            }
            if (layer === 0 && e.meta.history !== true) {
                handleUndoList(e)
            }
            redraw()
        })

        const unwatchCoopStatus = coopStatus.__edata__.watch(e=>{
            if (/^cur_select$/.test(e.path.join())) {
                // const cur_select_array = coopStatus.cur_select_array || []
                if((coopStatus.cur_select || {})[node.id]) {
                    redraw()
                }
            }
        })
        return () => {
            ws && ws.close()
            unwatchCoopStatus && unwatchCoopStatus()
            unwatchStatus && unwatchStatus()
            unwatch && unwatch()
        }
    }, [location.href, routeParams, routeParams.id])

    useEffect(() => {
        return eStatus.watch(e => {
            if (e.path[0] === 'cur_select' || e.path[0] === 'cur_edit') {
                const isEdit = nodeStatus.cur_edit === node.id
                const isSelected = nodeStatus.cur_select === node.id
                const prevNodeId = unwrapEdata(e.meta.oldData)
                const shouldUpdate = node.id === prevNodeId || isSelected || isEdit
                if (isSelected) {
                    const prevNode = node
                    if (prevNode) {
                        const ePrev = prevNode.__edata__
                        if (ePrev !== ePrev.root) {
                            const parentNode = (ePrev.closest().closest() || ePrev.root).proxy()
                            _.set(parentNode, 'meta.selectedIndex', parentNode.children && parentNode.children.findIndex(v => v && v.id === node.id))
                        }
                    }
                }
                if (shouldUpdate) {
                    redraw()
                }
            }
        })
    }, [location.href])

    useLayoutEffect(() => {
        node_refs.add({ ref: self, node, on_left, layer })
        return () => {
            let find
            for (let n of node_refs) {
                if (n.node.id === node.id) {
                    find = n
                    break
                }
            }
            node_refs.delete(find)
        }
    }, [location.href])

    useLayoutEffect(() => {
        if (nodeStatus.cur_select !== node.id) return
        const { rect, ref } = getNodeById(node.id) || {} as any
        if (rect && ref.current) {
            const r = ref.current.getBoundingClientRect()
            const diffY = rect.y - r.y
            if (Math.abs(diffY) > 1e-6) {
                mindMapStyle.transform.translateY += diffY / (mindMapStyle.transform.scale)
                // centerNode(node)
            }
        }
    })

    useEffect(()=>{
        const onLongPress = e => {
            if(e.path && e.path.indexOf(self.current) > -1 && nodeStatus.cur_edit != node.id) {
                e.preventDefault()
                handleEditNode(e)
            }
        }
        const onContextMenu = e => {
            console.log('contextmenu')
            e.preventDefault()
        }
        if(!isMobile.any) {
            return
        }
        // document.body.addEventListener('contextmenu', onContextMenu, true)
        document.addEventListener('long-press', onLongPress)
        return ()=>{
            // document.body.removeEventListener('contextmenu', onContextMenu, true)
            document.removeEventListener('long-press', onLongPress)
        }
    }, [])

    const style = _.get(node, 'attrs.style', {})
    const link = _.get(node, 'attrs.links.link', '')
    const note = _.get(node, 'attrs.notes.note', '')
    const startValue = _.get(node, 'attrs.tasks.startValue', '')
    const endValue = _.get(node, 'attrs.tasks.endValue', '')
    const director = _.get(node, 'attrs.tasks.director', {})
    const level = _.get(node, 'attrs.tasks.level', '')
    const tag = _.get(node, 'attrs.tasks.tag', '')
    const comment = _.get(node, 'attrs.comments.comment', '')
    const isHide = !node.showChildren || node.hideChildren
    const submap = _.get(node, 'attrs.submap.id', null)

    const readOnly = isCurrentNodeReadOnly(node)

    const handleSelectNode = e => {
        handlePropagation(e)
        eStatus.set('cur_select', node.id)
        eStatus.set('select_by_click', true)
        const defaultTab = eStatus.unwrap('selected_comment') ? 'comment' : 'task'
        eStatus.set('tab', defaultTab)
        eStatus.set('showActionPanel', true)
    }
    const handleEditNode = e => {
        nodeStatus.cur_edit = node.id
    }
    const handleToggleChildren = e => {
        toggleNode(node)
    }

    const handleRouter = e => {
        handlePropagation(e)
        const submap = _.get(node, 'attrs.submap.id', null)
        const copyNodeId = ensureArray(_.get(node, 'attrs.copyInfo.meta.nodeId', [])).join(',')
        const chargeNodeId = ensureArray(_.get(node, 'attrs.chargeInfo.meta.nodeId', [])).join(',')
        const selectId = chargeNodeId || copyNodeId || ''
        const queryReadOnly = new URL(location.href).searchParams.get('readOnly')
        const readOnly = copyNodeId ? 1 : queryReadOnly || ''
        const params = readOnly ? `&readOnly=${readOnly}` : ''
        app.history.push(`${prefix}/mm/${submap}?selectId=${selectId}${params}`)
    }

    const handleTime = () => {
        const endValue = _.get(node, 'attrs.tasks.endValue', '')
        const finshedStatus = _.get(node, 'attrs.tasks.status') // , 'NOSTART'
        const okTime = _.get(node, 'attrs.tasks.okTime', '')
        const date = moment().valueOf()
        const days = moment(+endValue).diff(moment(date), 'days') + 1
        const time = moment(+endValue).diff(moment(+okTime), 'days')
        const NOSTART = finshedStatus === 'NOSTART'
        if (NOSTART || !finshedStatus) {
            const value = endValue ? moment(+endValue).format('MM/DD') : NOSTART ? '未开始' : ''
            return value && <span className={css['node-time']} >{value}</span>
        }
        if (finshedStatus === 'ONGOING') {
            if (days >= 10) {
                return <span className={css['node-time']} style={{ borderColor: '#00913C', color: '#00913C' }} >{days}d</span>
            }
            if (days > 5 && days < 10) {
                return <span className={css['node-time']} style={{ borderColor: '#FFA900', color: '#FFA900' }} >{days}d</span>
            }
            if (days <= 5) {
                return <span className={css['node-time']} style={{ borderColor: '#DB0000', color: '#DB0000' }} >{days}d</span>
            }
        }
        if (finshedStatus === 'FINISHED' && okTime) {
            if (time >= 0) {
                return <span className={css['node-time']} style={{ borderColor: '#00913C', color: '#00913C' }} >已完成</span>
            }
            if (time < 0) {
                return <span className={css['node-time']} style={{ borderColor: '#DB0000', color: '#DB0000' }} >已完成</span>
            }

        }

    }

    const handleLevel = () => {
        if (level === 'LOW') {
            return <Badge count='低' style={{ backgroundColor: '#fff', border: '1px solid #87d068', color: '#87d068' }} />
        } else if (level === 'HIGH') {
            return <Badge count='高' style={{ backgroundColor: '#fff', border: '1px solid #f50', color: '#f50' }} />
        }
        // else if (level === 'MIDDLE') {
        //     return <Badge count='中' style={{ backgroundColor: '#fff', border: '1px solid orange', color: 'orange' }} />
        // }
    }

    const handleTag = () => {
        if (tag) {
            return <Tag color="#87d068" style={{ marginLeft: '8px' }}>{tag}</Tag>
        }
    }

    const handleNodeIcon = (e, value) => {
        handlePropagation(e)
        eStatus.set('cur_select', node.id)
        eStatus.set('tab', value)
        eStatus.set('showActionPanel', true)
    }

    const gotoParentNode = e => {
        const parentId = _.get(node, 'attrs.submap.parent.rootId')
        const selectId = _.get(node, 'attrs.submap.parent.nodeId', '')
        if (parentId) {
            app.history.push(`${prefix}/mm/${parentId}?selectId=${selectId}&readOnly=1`)
        }
    }

    const isUserCenter = !routeParams.id
    const showSubMap = submap && routeParams.id !== submap && layer > 0
    const shouldShowSubMap = routeParams.id ? true : layer < 2
    
    const linkValue = _.get(node, 'attrs.links.link', '')
    const parentTexts = _.get(node, 'attrs.submap.parent.texts', []).slice(0, 3)
    const spendTime = _.get(node, 'attrs.tasks.spendTime', '')
    const timeUnit = _.get(node, 'attrs.tasks.timeUnit', DEFAULT_TIME_UNIT)
    const sorting = _.get(node, 'attrs.sorting', '')
    const isEdit = nodeStatus.cur_edit === node.id
    const taskTime = handleTime()

    return (<div
        className={classnames(
            css.common_style,
            css['specific_style' + (layer < 3 ? layer : 3)],
            { [css.seleted_style]: nodeStatus.cur_select === node.id },
            {[css.selectId]: nodeStatus.selectId.indexOf(node.id) > -1},
            // {[css.hide_children]: node.hideChildren}
        )}
        draggable={layer > 0 && nodeStatus.cur_edit !== node.id}
        data-tag={on_left ? refer.LEFT_NODE : refer.RIGHT_NODE}
        data-parent={parent.id}
        data-show-children={node.showChildren}
        id={node.id}
        ref={self}
        onClick={handlePropagation}
    >
        {
            curSelectUserArray.length > 0 && <div className={css.coop_users_tip}>{curSelectUserArray.map(v=>v.xusername).join(',')}</div>
        }
        {
            isEdit &&
            <InputDiv node={node}>{node.text}</InputDiv>
        }
        <div
            className={css.drop_area}
            data-tag={refer.DROP_AREA}
            data-long-press-delay={700}
            onClick={handleSelectNode}
            onDoubleClick={readOnly ? null : handleEditNode}
        />
        {
            parentTexts.length > 0 && <small style={{ zIndex: 999, position: 'relative', color: 'gray', fontSize: '12px', fontWeight: 'normal' }}>
                {parentTexts.slice().join('-')}
                <i onClick={gotoParentNode} className={'zwicon-arrow-circle-right'}></i>
            </small>
        }
        <div className={css['node-time-title']}>
            {level && <span style={{ paddingRight: 8 }} onClick={(e) => { handleNodeIcon(e, 'task') }}>{handleLevel()}</span>}
            <h4 id={`node-title-${node.id}`} className={layer===0 ? css['node-root'] : ''} style={{ margin: 0, ...style }}>{sorting} {node.text}</h4>
            {/* {handleTag()} */}
            <div className={css.nodeActionWrap}>
            {showSubMap && <span data-submap={submap} onClick={handleRouter}><i className='iconfont iconnaotu' /></span>}
            {link && <span onClick={(e) => { handleNodeIcon(e, 'links') }}><a href={linkValue} target='_blank'><i className='iconfont iconlianjie' /></a></span>}
            {note && <span onClick={(e) => { handleNodeIcon(e, 'notes') }}><i className='iconfont iconzhushi' /></span>}
            </div>
        </div>
        {(director.key || taskTime) && <div style={{ marginRight: 4, paddingTop: 8, display: 'flex' }} onClick={(e) => { handleNodeIcon(e, 'task') }}>
            {spendTime && <div style={{ fontWeight: 'bold', marginRight: '8px' }}>{spendTime + timeUnit}</div>}
            {taskTime && <div style={{ flex: 1 }}>{taskTime}</div>}
            {director.label && <div>{director.label && <small style={{ fontSize: '12px', fontWeight: 'normal', marginLeft: '8px' }}>负责人:{director.label}</small>}</div>}
        </div>}
        {
            !isEdit
            ? (!submap || layer===0) && (
                nodeStatus.quickAddMode && shouldShowSubMap && !readOnly
                ? <button
                    className={classnames(
                        css.toggle_button,
                        css.quick_add,
                        (on_left ? css.button_left : css.button_right)
                    )}
                    onClick={e=>{
                            addChild(node)
                    }}>{
                        '+'
                    }
                    </button>
                : (layer > 0 && node.children && node.children.length > 0 && shouldShowSubMap) &&
                <button
                    className={classnames(
                        css.toggle_button,
                        { [css.show_plus]: isHide },
                        (on_left ? css.button_left : css.button_right)
                    )}
                    onClick={handleToggleChildren}>{
                        isHide ? node.children.length : '-'
                    }
                </button>
            )
            : <button
                className={classnames(
                    css.toggle_button,
                    css.quick_add,
                    (on_left ? css.button_left : css.button_right)
                )}
                data-has-event={true}
                onClick={e=>{
                    deleteNode(node, true)
                }}>{
                    'x'
                }
            </button>
        }
        <div className={classnames(
            css['icon-action'],
            { [css.icon_action_three]: layer >= 3 },
        )}
            onClick={handleSelectNode} onDoubleClick={readOnly ? null : handleEditNode}
        >
            {/* {(showSubMap || link || note) && layer < 3 && <Divider style={{ margin: '16px 0 4px' }} />} */}
            {/* {showSubMap && <span data-submap={submap} onClick={handleRouter}><i className='iconfont iconnaotu' /></span>}
            {link && <span onClick={(e) => { handleNodeIcon(e, 'links') }}><a href={linkValue} target='_blank'><i className='iconfont iconlianjie' /></a></span>}
            {note && <span onClick={(e) => { handleNodeIcon(e, 'notes') }}><i className='iconfont iconzhushi' /></span>} */}
            {/* {comment && <span onClick={(e) => { handleNodeIcon(e, 'comment') }}><img src={`${prefix}/assets/src/statics/icon/comment.png`} alt='评论' /></span>} */}
        </div>
    </div >)
}

export default Node