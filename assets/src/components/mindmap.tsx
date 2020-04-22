import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import RootNode from './root-node'
import css from '../css/index'
import { getStore, initStore } from 'edata-store'
import DragCanvas from './drag-canvas'
import LineCanvas from './line-canvas'
import { isInputActive } from '../methods/util'
import * as life from 'react-life-hooks'
import { getTransformStyle, node_refs, getNodeById, addSibling, addChild, mindMapStyle, deleteNode, toggleNode, selectOtherNode, isCurrentNodeReadOnly } from '../methods/node-util'
import { message } from 'antd'

export let mouseStatus = {
    isDown: false,
    downX: 0,
    downY: 0,
    baseX: 0,
    baseY: 0,
}

export default ({ mindmap, routeParams, container_ref }) => {
    // console.log(mindmap, routeParams, container_ref)
    const self = useRef<HTMLDivElement>()
    const canvasRef = useRef<HTMLCanvasElement>()
    const rootRef = useRef<HTMLDivElement>()
    const root_node = getStore().proxy()
    const eStatus = getStore('status')
    const onWheel = useCallback((event) => {
        if (isInputActive() || mouseStatus.isDown) {
            return
        }
        // event.preventDefault()
        const { target, deltaX, deltaY, shiftKey } = event
        if (!target || (
            !target.closest(`.${css["main-wrapper"]}`)
        )) {
            return
        }
        const { current } = self
        if (shiftKey) {
            mindMapStyle.transform.scale += event.deltaY * -0.01
            mindMapStyle.transform.scale = Math.min(Math.max(.125, mindMapStyle.transform.scale), 4)
        } else {
            mindMapStyle.transform.translateX -= deltaX
            mindMapStyle.transform.translateY -= deltaY
        }
        mouseStatus.isDown = false
    }, [])

    const clearNodeStatus = useCallback(() => {
        eStatus.set('showActionPanel', false)
        eStatus.set('cur_select', '')
        eStatus.set('tab', '')
    }, [])

    useEffect(() => {
        const unmapMMStyle = mindMapStyle.__watch__(({ path, data }) => {
            const { current } = self
            if (current) {
                if (path[0] === 'transform') {
                    current.style.transform = getTransformStyle(mindMapStyle.transform)
                }
            }
        })

        const el = document.getElementById('main-wrapper') as any
        el.addEventListener('click', clearNodeStatus)
        return () => {
            unmapMMStyle()
            el.removeEventListener('click', clearNodeStatus)
        }
    }, [])


    const onMouseDown = useCallback((e) => {
        // console.log(e.target)
        if (e.target &&
            (
                !isInputActive() &&
                !e.target.classList.contains(css.drop_area) &&
                e.target.closest('.' + css['main-wrapper']) &&
                !(document.activeElement && (document.activeElement as any).contentEditable === 'true')
                // !e.target.classList.contains(css['sub-node-wrapper']) ||
                // e.target.classList.contains(css['root-node-wrapper']) ||
                // e.target.classList.contains(css['main-wrapper'])
            )
        ) {
            mouseStatus.isDown = true
            mouseStatus.downX = e.pageX
            mouseStatus.downY = e.pageY
            mouseStatus.baseX = mindMapStyle.transform.translateX
            mouseStatus.baseY = mindMapStyle.transform.translateY
        }
    }, [])
    const onMouseMove = useCallback((e) => {
        if (mouseStatus.isDown && e.which) {
            const deltaX = e.pageX - mouseStatus.downX
            const deltaY = e.pageY - mouseStatus.downY
            if (deltaX) {
                mindMapStyle.transform.translateX = mouseStatus.baseX + deltaX
            }
            if (deltaY) {
                mindMapStyle.transform.translateY = mouseStatus.baseY + deltaY
            }
        }
    }, [])
    const onMouseUp = useCallback((e) => {
        mouseStatus.isDown = false
    }, [])

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (isInputActive()) {
            return
        }
        const is_on_mac = navigator.platform.toUpperCase().startsWith('MAC')
        const metaKey = is_on_mac ? event.metaKey : event.ctrlKey
        const cur_edit = eStatus.unwrap('cur_edit')
        const cur_select = eStatus.unwrap('cur_select')
        let { node, on_left } = (getNodeById(cur_select) || {}) as any
        if (!node) return
        const root = node.__edata__.root.proxy()
        if (root.id === node.id) {
            const selNode = root.children[(root.meta || {}).selectedIndex]
            if (selNode) {
                on_left = getNodeById(selNode.id).on_left
            }
        }

        if (node.id === cur_edit) return
        // console.log(cur_select, node, on_left)
        switch (event.key.toUpperCase()) {
            case 'TAB':
                if (!node.id) return
                if (node && node.id !== cur_edit) {
                    event.preventDefault()
                    addChild(node)
                }
                break
            case 'ENTER':
                if (
                    !node.id ||
                    document.activeElement && (document.activeElement as any).contentEditable === 'true' ||
                    document.querySelector('.ant-modal-mask')
                ) return
                if (node && node.id !== cur_edit) {
                    event.preventDefault()
                    if (metaKey || node.id === root_node.id) {
                        addChild(node)
                        // console.log(routeParams && routeParams.id, '1111111')
                    } else {
                        // console.log(routeParams && routeParams.id, '222222')
                        addSibling(node)
                    }
                }
                break
            case 'F2':
                if (!node.id) return
                eStatus.set('cur_edit', node.id)
                break
            case 'BACKSPACE':
            case 'DELETE':
                if (!node.id || document.activeElement && (document.activeElement as any).contentEditable === 'true') return
                deleteNode(node, !routeParams.id)
                break
            case ' ':
                if (!node.id) return
                event.preventDefault() // 默认行为会导致画面移动，因此 prevent，下同
                toggleNode(node)
                break
            case 'ARROWLEFT':
                event.preventDefault()
                selectOtherNode(node, on_left ? 'children' : 'parent')
                break
            case 'ARROWRIGHT':
                event.preventDefault()
                selectOtherNode(node, on_left ? 'parent' : 'children')
                break
            case 'ARROWUP':
                event.preventDefault()
                selectOtherNode(node, 'prev')
                break
            case 'ARROWDOWN':
                event.preventDefault()
                selectOtherNode(node, 'next')
                break
            default:
                break
        }
    }, [])

    useEffect(() => {
        window.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        window.addEventListener('keydown', onKeyDown)
        return () => {
            window.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            window.removeEventListener('keydown', onKeyDown)
        }
    }, [])

    useEffect(() => {
        window.addEventListener('wheel', onWheel, { passive: true })
        return () => {
            window.removeEventListener('wheel', onWheel)
        }
    }, [])

    return (
        <div className={css['mindmap-wrapper']} ref={self}>
            <RootNode routeParams={routeParams} mindmap={mindmap} key={root_node.id} layer={0} node={root_node} node_refs={node_refs} ref={r => rootRef.current = r && (r as any).rootRef} />
            <DragCanvas parent_ref={self} container_ref={container_ref} mindmap={root_node} routeParams={routeParams} />
            <LineCanvas ref={canvasRef} parent_ref={rootRef} mindmap={root_node} node_refs={node_refs} />
        </div>
    )
}
