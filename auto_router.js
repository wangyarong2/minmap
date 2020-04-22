/** do not modify this file, genaratered by api-annotation **/
'use strict';

/*
function process(fn, type, wrap, config) {
  if (type === 'public') {
    return fn;
  }
  if (wrap) {
    return function (req, callback) {
      fn(req, callback);
    };
  } else {
    return function (req, res, next) {
      fn(req, res, next);
    };
  }
}
*/
function defaultProcess(fn, type, wraped) {
  return fn;
}
const ctrls = {
  './controller/index.js': require('./controller/index.js')
};
var config = {};

module.exports = function (router, process) {
  if (!process) {
    process = defaultProcess;
  }
  router.get('/api/memberList', process(ctrls['./controller/index.js'].memberList, 'public', true), true);
  router.get('/api/logout', process(ctrls['./controller/index.js'].logout, 'public', true), true);
  router.get('/api/login', process(ctrls['./controller/index.js'].login, 'public', true), true);
  router.get('/api/isLogin', process(ctrls['./controller/index.js'].isLogin, 'public', true), true);
  router.get('/api/hello_text', process(ctrls['./controller/index.js'].helloText, 'public', true), true);
  router.post('/api/dingTalk', process(ctrls['./controller/index.js'].dingTalk, 'public', true), true);
  router.get('/*', process(ctrls['./controller/index.js'].welcomeTpl, 'public', true), true);
};
