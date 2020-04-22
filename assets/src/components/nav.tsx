import React, { useEffect, useState } from 'react'
import { useSettingContext, ThemeActions } from './context/settings'
import Toolbar from './toolbar'
import { Button, Icon, Modal, Input, Avatar, Menu, Dropdown } from 'antd'
import css from '../css'
import { getStore } from 'edata-store'
import _ from 'lodash'
import { getUserInfo, diffNodes, getAuthor, prefix, generateShareLink, isInputActive } from '../methods/util'
import { saveDataFactory } from './common'
const { TextArea } = Input

export default function Nav(props) {
    const [settings, dispatch] = useSettingContext()
    const [shareLinkValue, setShareLinkValue] = useState('')
    const eStatus = getStore('status')
    const saveData = saveDataFactory(props)
    const changeTheme = e => {
        dispatch({
            type: ThemeActions.changeTheme,
            data: { color: ['red', 'blue'][Math.round(Math.random())] }
        })
    }

    const toggleOutline = () => {
        eStatus.getset('showOutline', v => {
            return !v.value
        })
    }

    function gotoHome() {
        props.history.push(`${prefix}/`)
    }

    function logOut() {
        localStorage.clear()
        props.login.logout()
        props.history.push(`${prefix}/login?from=${encodeURIComponent(location.href)}`)
    }

    function shareLink(){
        const link = generateShareLink()
        setShareLinkValue(link)
    }
    function closeShareLink(){
        setShareLinkValue('')
    }

    useEffect(() => {
        const handleKeydown = event => {
            if ((event.ctrlKey || event.metaKey) && event.which == 83) {
                event.stopPropagation()
                event.preventDefault()
                saveData()
            }
        }
        window.addEventListener('keydown', handleKeydown)
        const autoSaveInterval = setInterval(()=>{
            if (isInputActive() || eStatus.unwrap('cur_edit')) {
                return
            }
            saveData({silent: true})
        }, 10000)
        return () => {
            window.removeEventListener('keydown', handleKeydown)
            clearInterval(autoSaveInterval)
        }
    }, [props.routeParams.id])

    const { routeParams } = props
    const userInfo = getUserInfo()
    const menu = (
        <Menu>
             <Menu.Item>
             {userInfo && <a href="#" onClick={gotoHome}>个人中心</a>}
            </Menu.Item>
            <Menu.Item>
                {userInfo && <a href="" onClick={logOut}>退出</a>}
            </Menu.Item>
        </Menu>
    );
    return <nav className={css['nav-top']} style={...settings.theme}>
        <Toolbar {...props}></Toolbar>
        <div style={{ flex: 1 }}></div>

        <Modal
            title="分享"
            visible={!!shareLinkValue}
            okText='分享'
            onCancel={closeShareLink}
            footer={[<Button key="submit" onClick={closeShareLink}>关闭</Button>]}
        >
            请复制粘贴以下内容到钉钉消息框：
            <TextArea style={{ width: '100%', height: '100%' }} readOnly value={shareLinkValue} onFocus={e => { e.target.select() }}></TextArea>
        </Modal>
        <Button style={{ borderRadius: 16 }} type='primary' onClick={shareLink}>分享</Button>
        <Button style={{ borderRadius: 16 }} type='primary' onClick={saveData}>保存</Button>
        <Dropdown overlay={menu} placement="bottomLeft">
            <div>
                <span onClick={gotoHome}><Avatar icon="user" /></span>
                {userInfo && <span onClick={gotoHome}>{userInfo.xusername}</span>}
            </div>
        </Dropdown>
    </nav>
}
