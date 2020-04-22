const WebSocket = require('ws')
const _ = require('lodash')
const Cookie = require('cookie')
const url = require('url')
const qs = require('qs')
const edata = require('edata').default

module.exports = (app,cfg)=>{
    const {server} = app

    const cachedData = {}
    const nodeStatusData = {}

    const wss = new WebSocket.Server({ noServer: true })

    function broadcast({filter, message}) {
        let range = wss.clients
        if(filter) {
            range = filter([...range])
        }
        range.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.sendMsg(message)
            }
        })
    }

    wss.on('connection', function connection(ws, request, client) {
        // console.log(client)
        const {query: {uid, userInfo = {}}, id} = client
        const idNodeStatus = nodeStatusData[id] = nodeStatusData[id] || {}
        ws.on('message', function incoming(message) {
            // console.log('received: %s', message)
            try{
                var {type, payload} = JSON.parse(message)
            }catch(e){}
            if(type === 'mm:node_status') {
                let {cur_select, prev_select} = payload
                if(cur_select) {
                    prev_select = prev_select || userInfo.prev_select
                    arrayKV(idNodeStatus, ['cur_select', cur_select], userInfo)
                    userInfo.prev_select = cur_select
                }
                if (prev_select) {
                    const arr = _.get(idNodeStatus, ['cur_select', prev_select])
                    if(arr) {
                        _.remove(arr, v=>v && v.id === userInfo.id)
                    }
                }
                // console.log(idNodeStatus)
                broadcast({
                    filter: clients=>{
                        return clients.filter(v=>{
                            return _.get(v, 'client.id') === id
                        })
                    },
                    message: {type:'mm:node_status', payload: idNodeStatus, inPayload: payload, id}
                })
            }
            if(type === 'mm:node_action') {

                // update xjson
                let {xjson} = cachedData[id] || {}
                if(xjson && xjson.__isEdata__) {
                    const {type, path, value, nodeId} = payload
                    const [leaf] = path.slice(-1)
                    const tree = path.slice(0, -1)
                    console.log(type, path, nodeId)
                    // array operation
                    if(_.last(tree) === 'children' && !isNaN(leaf) && leaf !== '') {
                        console.log('node_action array:', new Date().toLocaleDateString(), userInfo.xusername, type, path)
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
                        console.log('node_action normal:', new Date().toLocaleDateString(), userInfo.xusername, type, path)
                        if(type==='delete') {
                            xjson.unset(path)
                        } else {
                            xjson.set(path, value)
                        }
                    }
                }
                
                broadcast({message})
            } else if(type === 'mm:xjson') {
                let {xjson} = cachedData[id] || {}
                ws.sendMsg({xjson: xjson && xjson.unwrap()})
            }
        })

        ws.on('close', function close() {
            cleanUp()
            console.log('disconnected')
        })

        ws.on('error', err=>{
            cleanUp()
            console.log('ws error:', err)
        })

        function sendMsg(msg) {
            if (ws.readyState !== ws.OPEN) {
                console.log('ws is not open')
            } else {
                ws.send(typeof msg==='string' ? msg : JSON.stringify(msg))
            }
        }
        ws.sendMsg = sendMsg.bind(ws)
        ws.uid = uid
        ws.userInfo = userInfo
        ws.client = client

        sendMsg({type: 'open', uid})
        var inter = setInterval(()=>{
            sendMsg({type: 'ping'})
        }, 15000)
        var cleanUp = function(){
            console.log('clean userInfo', userInfo)
            _.forEach(idNodeStatus.cur_select, arr=>{
                _.remove(arr, v=>v && v.id === userInfo.id)
            })
            clearInterval(inter)
        }
    })

    server.on('upgrade', function upgrade(request, socket, head) {
        const cookie = Cookie.parse(request.headers.cookie || '')
        let {pathname, query = ''} = url.parse(request.url)
        query = qs.parse(query)
        const match = /^\/mind\/mm\/([\w\d-]+)$/i.exec(pathname)
        // console.log('upgrade', request.url)
        if(!match || !query.uid) {
            socket.destroy()
            return
        }

        wss.handleUpgrade(request, socket, head, function done(ws) {
            wss.emit('connection', ws, request, {cookie, query, pathname, id: match[1]})
        })
    })

    return (req, res, next) =>{
        const matchMindmapId = /^\/api\/proxy\/mindmap\/jsonapi\/form_mindmap\/([\w\d-]+)$/i.exec(req.path)
        const matchComment = /^\/api\/proxy\/mindmap\/jsonapi\/form_mindComment\b/i.exec(req.path)
        if(matchComment) {
            if(['PATCH', 'POST', 'DELETE'].indexOf(req.method)>-1) {
                const {rootId:id, nodeId} = req.query
                broadcast({
                    filter: clients=>{
                        return clients.filter(v=>{
                            return _.get(v, 'client.id') === id
                        })
                    },
                    message: {
                        id,
                        type: 'mm:comment_update',
                        payload: {
                            nodeId,
                            method: req.method
                        }
                    }
                })
            }
            next()
            return
        }
        if(matchMindmapId) {
            const id = matchMindmapId[1]
            let {xjson, data} = cachedData[id] || {}

            if (req.method === 'PATCH') {
                const {toSave} = req.query
                if(toSave) {
                    Object.assign(xjson.proxy(), toSave)
                    broadcast({
                        filter: clients=>{
                            return clients.filter(v=>{
                                return _.get(v, 'client.id') === id
                            })
                        },
                        message: {
                            id,
                            type: 'mm:node_patch',
                            payload: {toSave}
                        }
                    })
                }
                return next()
            }
            if (req.method === 'DELETE') {
                broadcast({
                    filter: clients=>{
                        return clients.filter(v=>{
                            return _.get(v, 'client.id') === id
                        })
                    },
                    message: {
                        type: 'mm:node_delete',
                        payload: {id}
                    }
                })

                delete cachedData[id]
                return next()
            }
            if (req.method === 'GET') {
                const {reload} = req.query
                if(_.isObject(xjson) && !isQueryTruthy(reload)) {
                    console.log('from cache', id)
                    data.data.attributes.xjson = JSON.stringify(xjson.unwrap())
                    res.json(data)
                    return
                }
                
                console.log('from db:', id)

                req.getRequest('mindmap').get(`/jsonapi/form_mindmap/${id}`, (err, data = {}) => {
                    if(err) {
                        res.status(500).end(err.message)
                    } else {
                        let xjson
                        try{
                            xjson = edata(JSON.parse(data.data.attributes.xjson))
                        }catch(err){
                            res.json(data)
                            const message = _.get(data, 'errors.0.detail')
                            console.log(id, message)
                            return
                        }
                        cachedData[id] = {
                            data,
                            xjson
                        }
                        res.json(data)
                    }
                })
            } else {
                next()
            }
        } else {
            next()
        }
    }
}

function isQueryTruthy(value){
    return String(value) === '1' || String(value) === 'true'
}

function arrayKV (obj, k, v, reverse, unique) {
    let prevVal = _.get(obj, k)
    if(!Array.isArray(prevVal)) {
        prevVal = prevVal === undefined ? [] : [prevVal]
        _.set(obj, k, prevVal)
    }
    if(arguments.length < 3) return
    if (unique && prevVal.indexOf(v) > -1) return
    return reverse ? prevVal.unshift(v) : prevVal.push(v)
}


