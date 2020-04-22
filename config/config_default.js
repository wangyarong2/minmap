'use strict';
const _ = require('lodash');
const path = require('path');
const jsonApiHeaderExt = (req, cfg) => {
  return {
    // Accept: 'application/vnd.api+json',
    // 'Content-Type': 'application/vnd.api+json',
    Authorization: 'Bearer ' + cfg.token,
  }
}

const dingTalkApiHeaderExt = (req, cfg) => {
  return {
    Accept: 'application/json;charset=UTF-8',
    'Content-Type': 'application/json;charset=UTF-8',
    Authorization: 'Bearer ' + cfg.token,
  }
}

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoic3lzdGVtIiwiaWF0IjoxNTY5MzkzOTAzLCJleHAiOjE2MDA5Mjk5MDN9.NzCNFC_XHukFr9tW9JAsfjp12XGmuWMhFyCFbjNKP4g'

module.exports = {
  /* honeybee config occupied */
  root: undefined,
  serverRoot: undefined,
  serverEnv: undefined,
  /* honeybee config end */
  debug: false,
  prefix: true,
  staticPath: undefined,
  logs: {
    sys: {
      level: 'INFO'
    }
  },
  middleware: {
    cookieSession: {
      config: {
        secret: 'defalutSecret!PLEASE!REPLACE!'
      }
    },
    bodyParser: {
      deps: 'proxy',
      config: {
        json: {
          type: [
            'application/json',
            'application/vnd.api+json'
          ]
        }
      }
    },
    csrf: {
      config: {
        ignore: function (req) {
          if (['/__csp__', '/ssend'].includes(req.path)) {
            return true
          }
        }
      }
    },
    wss: {
      enable: true,
      module: '../middleware/wss.js',
      config: {abc:123}
    },
    proxy: {
      deps: 'wss',
      enable: true,
      module: 'hc-mid-proxy',
      config: {
        routes: {
          mindmap: {
            prefix: '/api/proxy/mindmap/',
            endpoint: 'http://47.98.210.8:4000',
            token,
            headerExtension: [
              jsonApiHeaderExt
            ],
            api: [
              '/jsonapi/form_mindComment',
              '/jsonapi/form_mindComment/:id',
              {
                path: '/jsonapi/form_mindmap/:id'
              },
              {
                path: '/jsonapi/form_mindmap',
                onRequest: req=>{
                  const validParams = _.get(req.query, 'filter.xauthor')
                    || _.get(req.query, 'filterp.xcopyPerson')
                    || _.get(req.query, 'filterp.xchargePerson')
                  if(req.method==='GET' && !validParams) {
                    throw new Error('form_mindmap lost query')
                  }
                }
              }
            ]
          },
        }
      }
    },
  },
  extension: {
    requestClient: {
      enable: true,
      module: 'hc-request-client',  //  ../middleware/request.js
      config: {
        mindmap: {
          endpoint: process.env.API_ENDPOINT || 'http://47.98.210.8:4000',
          accessKeySecret: 'xxxhcjia',
          responseWrapper: e => e,
          dataType: 'application/vnd.api+json',
          contentType: 'application/vnd.api+json',
          token,
          headerExtension: [
            jsonApiHeaderExt
          ]
        },
        dingTalk: {
          endpoint: process.env.API_ENDPOINT || 'https://oapi.dingtalk.com',
          accessKeySecret: 'xxxhcjia',
          responseWrapper: e => e,
          dataType: 'application/json;charset=UTF-8',
          contentType: 'application/json;charset=UTF-8',
          token,
          headerExtension: [
            dingTalkApiHeaderExt
          ]
        },
        email: {
          endpoint: 'https://api.sendgrid.com/v3/mail/send',
          accessKeySecret: 'xxxhcjia',
          responseWrapper: e => e,
          token: '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',
          from: '脑图 <mindmap@em4797.sendgrid.haochengjia.net>',
          headerExtension: [
            (req, cfg) => {
              return {
                'content-type': 'application/json',
                authorization: 'Bearer ' + cfg.token
              }
            }
          ]
        }
      }
    },
  }
};
