import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef, Ref, MutableRefObject, useCallback } from 'react'
import { getTheme } from '../statics/setting'
import { drawLineCanvas } from '../methods/draw-canvas'
import { setupCanvas } from '../methods/canvas-functions'
import css from '../css/index'
import * as life from 'react-life-hooks'
import { mindMapStyle } from '../methods/node-util'

const LineCanvas = ({ parent_ref, mindmap, node_refs }, ref) => {
    const self = useRef<HTMLCanvasElement>()
    const [flag, setFlag] = useState(0)
    const theme = getTheme()

    useImperativeHandle(ref, () => (self.current))
    const handleWindowResize = useCallback(() => {
        setFlag(Date.now())
    }, [])
    useEffect(() => mindmap.__edata__.watch(e => {
        if (/meta,selectedIndex$/.test(e.path)) {
            return
        }
        handleWindowResize()
    }), [])
    life.onDidUpdate(() => {
        // console.log('line-canvas update:', node_refs.size)
    })

    useEffect(() => {
        const unmap = mindMapStyle.__watch__(({ path, data }) => {
            if (path[0] === 'transform') {
                /** DON'T add below line, LOW PERFORMANCE! */
                // redrawCanvas()
            }
        })
        window.addEventListener('resize', handleWindowResize)
        return () => {
            unmap()
            window.removeEventListener('resize', handleWindowResize)
        }
    }, [])

    const refDraw = useRef<number>()
    const redrawCanvas = () => {
        if (!parent_ref.current) return
        const map = new Map(Array.from(node_refs)
            .map((v: any) => ({ref: v.ref as MutableRefObject<HTMLElement>, layer: v.layer}))
            .filter(({ref}) => {
                return ref.current && !ref.current.closest('.' + css.hide_children)
            })
            .map(
                ({ref, layer}) =>
                    [
                        ref.current.id,
                        [
                            (ref.current.offsetLeft),
                            (ref.current.offsetLeft + ref.current.offsetWidth),
                            (ref.current.offsetTop),
                            (ref.current.offsetTop + ref.current.offsetHeight),
                            ref.current.dataset.tag,
                            layer
                        ]
                    ]
            ))
        window.clearTimeout(refDraw.current)
        // refDraw.current = window.setTimeout(() => {
        const dom = self.current
        dom.width = parent_ref.current.offsetWidth
        dom.height = parent_ref.current.offsetHeight // 重新设置 canvas 大小，也兼具清除画板的作用
        const ctx = setupCanvas(dom)
        drawLineCanvas(ctx, theme, mindmap, map)
    }
    useEffect(() => {
        redrawCanvas()
    }, [mindmap, theme, flag, parent_ref.current, node_refs.size])

    return (<canvas ref={self} className={css['line-canvas-wrapper']} />)
}

export default forwardRef(LineCanvas)
