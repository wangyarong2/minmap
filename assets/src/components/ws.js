import PersistentWebSocket from 'pws'
import qs from 'qs'
import { NewID, getUserInfo } from '../methods/util'

export function createWebSocket({id, query = {}}) {
    const uid = NewID()
    query.uid = uid
    var ws = new PersistentWebSocket(`ws://${location.host}/mind/mm/${id}?${qs.stringify(query)}`, null, {
        // pingTimeout: 30 * 1000 // close if no message received in 30s.
    })

    ws.onopen = function open() {
        console.log('connected')
    }

    ws.onclose = function close() {
        console.log('disconnected')
    }

    ws.onmessage = function incoming(e) {
        let {data} = e
        try{
            data = JSON.parse(data)
        }catch(e){
            data = {}
        }

        const stop = ()=>e.stopImmediatePropagation()
        if(data.type==='ping' || data.uid === uid) {
            stop()
            return
        }
        // console.log(`got message`, data)
        switch(data.type) {
            case 'open':{
                sendMsg({uid})
                stop()
                break
            }
        }
    }
    ws.onerror = e => console.log('ws error:', e)

    function sendMsg(msg) {
        if (ws.readyState !== ws.OPEN) {
            console.log('ws is not open')
        } else {
            ws.send(typeof msg==='string' ? msg : JSON.stringify(msg))
        }
    }
    ws.sendMsg = sendMsg.bind(ws)
    ws.uid = uid
    return ws
}

