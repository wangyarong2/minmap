import {prefix} from '../methods/util'

export default {
    name: 'login',
    store: {
        userInfo: {}
    },
    actions: {
        // 用户信息
        getUserInfo: { url: `${prefix}/api/login`, },
        logout: { url: `${prefix}/api/logout`, },
        // 是否登录
        isLogin: { url: `${prefix}/api/isLogin` },
        // 成员列表
        getMemberList: { url: `${prefix}/api/memberList` }
    }
}
