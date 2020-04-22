import _ from 'lodash'
import { getStore } from 'edata-store'
import { message } from 'antd'
import { getNodeById, flatNodes, isCurrentNodeReadOnly } from '../methods/node-util'
import { handlePropagation } from '../methods/assist-functions'
import { getAuthor, diffNodes, getUserInfo, prefix } from '../methods/util'

export const saveDataFactory = props => (options) => {
    const {silent = false} = options || {}
    const eStatus = getStore('status')
    const { routeParams } = props
    const maplist = getStore().proxy()
    // 有id的详情页数据更新
    if (routeParams && routeParams.id) {
        const deleted = eStatus.unwrap('deleted') || []
        if(deleted.indexOf(routeParams.id) > -1) {
            !silent && alert('已被删除，无法保存')
            return
        }
        if(isCurrentNodeReadOnly(maplist)) {
            // return Promise.resolve()
        }
        const xauthor = getAuthor(maplist)
        const [allNodes = []] = flatNodes(maplist)
        const copyPerson = (_.flatten(allNodes.map(node=>_.get(node, 'attrs.tasks.copyPerson', []))))
        const chargePerson = (_.flatten(allNodes
            .filter(v=>!_.get(v, 'attrs.submap.id') && v.id !== maplist.id)
            .map(node=>_.get(node, 'attrs.tasks.director'))
            .filter(v=>!_.isEmpty(v))
        ))
        const testPerson = (_.flatten(allNodes
            .filter(v=>!_.get(v, 'attrs.submap.id') && v.id !== maplist.id)
            .map(node=>_.get(node, 'attrs.tasks.tester'))
            .filter(v=>!_.isEmpty(v))
        ))

        const allCopyPerson = _.groupBy(copyPerson, v=>v.key || v.id)
        const allChargePerson = _.groupBy(chargePerson, v=>v.key || v.id)
        const alltestPerson = _.groupBy(testPerson, v=>v.key || v.id)
        // console.log('copyPerson',chargePerson,copyPerson)

        const xtestPerson = _.map(alltestPerson, (v, id)=>({id, type: 'form_mindUser', meta: {nodeId: v.map(x=>(x.meta||{}).nodeId).filter(Boolean)} }))
        const xchargePerson = _.map(allChargePerson, (v, id)=>({id, type: 'form_mindUser', meta: {nodeId: v.map(x=>(x.meta||{}).nodeId).filter(Boolean)} }))
        const xcopyPerson = _.map(allCopyPerson, (v, id)=>({id, type: 'form_mindUser', meta: {nodeId: v.map(x=>(x.meta||{}).nodeId).filter(Boolean)} })).concat(xtestPerson)
        return props.mindmap.updateMindMap({
            data: {
                attributes: {
                    xjson: JSON.stringify(maplist),
                    xauthor,
                    xcopyPerson,
                    xchargePerson,
                    xtestPerson,
                },
            },
            meta: { _timestamp: _.get(maplist, 'meta._timestamp') }
        }, { id: routeParams.id }).then((res) => {
            if(silent) {
                return
            }
            if (res.body.data) {
                message.success('更新成功！')
            } else {
                message.error('更新失败！')
            }
        })

    } else {

        const myNodes = getStore().unwrap('children.0.children', [])
        const { added, removed, changed } = diffNodes(myNodes, _.get(eStatus.get('rootData').unwrap(), 'children.0.children'))

        console.log({ added, removed, changed })

        let allPromise = []
        let srcNodes = maplist.children[0].children

        // 首页新增节点
        const addNodes = srcNodes.filter((item) => added.indexOf(item.id) > -1)
        allPromise.push(...addNodes.map((item) => {
            const xauthor = getAuthor(item)
            const { attributes, ...rest } = item
            const userInfo = getUserInfo()
            _.set(rest, 'attrs.creator', userInfo)
            _.set(rest, 'attrs.tasks.director', {
                key: userInfo.id,
                label: userInfo.xusername,
                meta: {}
            })
            return props.mindmap.createMindMap({
                data: {
                    attributes: {
                        xjson: JSON.stringify(rest),
                        xauthor,
                        // xcreator: {
                        //     id: getUserInfo().id,
                        //     type: 'form_mindUser'
                        // }
                    },
                },
                meta: { _timestamp: _.get(item, 'meta._timestamp') }
            }).then((res) => {
                if (res.body.data) {
                    const {id} = res.body.data
                    item.id = id
                    _.set(item, 'attrs.submap.id', id)
                    _.set(item, 'attrs.tasks.director.meta.nodeId', id)
                    // message.success('创建成功！')
                } else {
                    message.error('创建失败！' + item.id)
                }
            })
        }))

        // 首页节点更新
        const changedNodes = srcNodes.filter((item) => changed.indexOf(item.id) > -1)
        allPromise.push(...changedNodes.map((node) => {
            const {id} = node
            if(isCurrentNodeReadOnly(node)) {
                return Promise.resolve()
            }
            return props.mindmap.getMindMap(null, { id }).then(res => {
                if (res.body.errors) {
                    message.error(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                    return
                }
                let xauthor = getAuthor(node)
                let { xjson, xauthor:oldAuthor, _timestamp } = res.body.data.attributes
                xjson = JSON.parse(xjson)
                // 如果已有作者，就不更新作者
                if(oldAuthor && _.isEmpty(_.get(node, 'attrs.tasks.director'))) {
                    xauthor = oldAuthor
                }
                const {children, ...toSave} = node
                Object.assign(xjson, toSave)
                console.log('toSave', toSave)
                return props.mindmap.updateMindMapWithQuery({ data: { attributes: { xjson: JSON.stringify(xjson), xauthor } } }, {
                    params: {id},
                    query: {
                        toSave
                    }
                }).then((res) => {
                    if (res.body.data) {
                        message.success('更新成功！')
                    } else {
                        message.error('更新失败！')
                    }
                })
            }).catch(err=>{
                message.error(`更新脑图出错：${err.message}`)
            })
        }))

        // 首页节点删除
        allPromise.push(...removed.map((id) => {
            return props.mindmap.getMindMap(null, { id }).then(res => {
                if (res.body.errors) {
                    message.error(`${res.body.errors[0].status}: ${res.body.errors[0].detail}`)
                    return
                }
                let { xjson, _timestamp } = res.body.data.attributes
                xjson = JSON.parse(xjson)
                const allNodes = flatNodes(xjson)
                const subMaps = allNodes.filter(node=>_.get(node, 'attrs.submap.id'))
                // if(subMaps.length) {
                //     message.error('请取消以下子脑图后删除：' + subMaps.map(v=>v.text).join(' '))
                //     return
                // }
                return props.mindmap.deleteMindMap(null, { id }).then((res) => {
                    if (res.body.errors) {
                        message.error('删除失败！')
                    } else {
                        message.success('删除成功！')
                    }
                })
            }).catch(err=>{
                message.error(`删除脑图出错：${err.message}`)
            })
        }))

        return Promise.all(allPromise).then(() => {
            eStatus.set('rootData', getStore().unwrap())
            setTimeout(() => {
                props.history.replace(props.match.url)
            })

            const userInfo = getUserInfo()
            // props.mindmap.dingTalk({
            //     "msgtype": "link",
            //     "link": {
            //         "text": `${userInfo.xusername}对脑图进行了${added.length > 0 ? '[添加]' : ''}${changed.length > 0 ? '[修改]' : ''}${removed.length > 0 ? '[删除]' : ''}操作`,
            //         "title": `脑图通知：操作者-${userInfo.xusername}`,
            //         "picUrl": '',
            //         "messageUrl": "http://47.98.230.246:8888/mind/mm/90d2bbe0-b61b-46e1-b40f-d24c122ec670"
            //     }
            // })
        })

    }

}