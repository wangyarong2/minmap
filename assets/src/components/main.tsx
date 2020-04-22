import React, { useRef } from 'react'
import classnames from 'classnames'
import Mindmap from './mindmap'
import css from '../css'
import * as life from 'react-life-hooks'

const Main = (props) => {
    const self = useRef()
    const { mindmap, routeParams } = props
    return (<main ref={self} className={
        classnames(css['main-wrapper'], css['main-theme'])
    } id='main-wrapper'>
        <Mindmap routeParams={routeParams} mindmap={mindmap} container_ref={self} />
    </main>)
}

export default Main
