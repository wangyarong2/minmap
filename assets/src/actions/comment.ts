const { prefix, apiEndpoint } = window.CONFIG
export default {
  name: 'comment',
  store: {
    
  },
  actions: {
    getCommentList: {
      // url: `${apiEndpoint}/jsonapi/form_mindmap`,
      url: `${prefix}/api/proxy/mindmap/jsonapi/form_mindComment`
    },
    getComment: {
      // url: `${apiEndpoint}/jsonapi/form_mindmap/:id`,
      url: `${prefix}/api/proxy/mindmap/jsonapi/form_mindComment/:id`
    },
    createComment: {
        paramStyle: 'beatle',
      // url: `${apiEndpoint}/jsonapi/form_mindmap`,
      url: `${prefix}/api/proxy/mindmap/jsonapi/form_mindComment`,
      method: 'POST'
    },
    deleteComment: {
        paramStyle: 'beatle',
      // url: `${apiEndpoint}/jsonapi/form_mindmap/:id`,
      url: `${prefix}/api/proxy/mindmap/jsonapi/form_mindComment/:id`,
      method: 'DELETE'
    },
    updateComment: {
        paramStyle: 'beatle',
      // url: `${apiEndpoint}/jsonapi/form_mindmap/:id`,
      url: `${prefix}/api/proxy/mindmap/jsonapi/form_mindComment/:id`,
      method: 'PATCH'
    },
  }
}
