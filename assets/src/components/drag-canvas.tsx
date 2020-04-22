import React, { useState, useEffect, useRef } from 'react';
import { getTheme } from '../statics/setting'
import getDragEvents from '../methods/drag-events';
import { moveNode } from '../methods/node-util';
import css from '../css/index'

const DragCanvas = ({ parent_ref, container_ref, mindmap, routeParams }) => {
    const self = useRef();
    const [flag, setFlag] = useState(0);
    const theme = getTheme()
    const handleWindowResize = () => {
        setFlag(Date.now());
    }
    useEffect(() => {
        window.addEventListener('resize', handleWindowResize);
        return () => {
            window.removeEventListener('resize', handleWindowResize);
        }
    }, [])

    useEffect(() => {
        if(routeParams.id) {
            const handleDrag = getDragEvents(mindmap, self.current, container_ref.current, theme, moveNode);
            handleDrag.forEach(event => window.addEventListener(event.type, event.listener));
            return () => {
                handleDrag.forEach(event => window.removeEventListener(event.type, event.listener));
            }
        }
    }, [mindmap, theme])

    useEffect(() => {
        const dom = self.current as any;
        dom.width = parent_ref.current.offsetWidth;
        dom.height = parent_ref.current.offsetHeight;
    }, [mindmap, flag]);

    return (<canvas ref={self} className={css['drag_canvas_wrapper']}
    />);
};

export default DragCanvas;