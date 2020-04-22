import {useEffect, useState} from 'react'
import {useRedraw} from 'react-life-hooks'
import { getStore } from 'edata-store'

export function useHistory(){
    const redraw = useRedraw()
    const hashchange = e=>{
        // getStore('status').set('cur_select', getStore().unwrap('id'))
        setTimeout(()=>{
            redraw()
        })
    }
    useEffect(()=>{
        window.addEventListener('hashchange', hashchange)
        return ()=>{
            window.removeEventListener('hashchange', hashchange)
        }
    }, [])
}
