'use strict';
var qs = require('qs');
var moment = require('moment');
var _ = require('lodash');
var config = require('../config');
var pkg = require('../package.json')
var ejs = require('ejs')
var path = require('path')
var fs = require('fs')
const {flatNodes} = require('./util')

var indexPath = path.resolve(__dirname, '../view/index.ejs')
var indexTemplate = fs.readFileSync(indexPath, 'utf8')
if(config.debug){
  indexTemplate = indexTemplate.replace('</body>', `
<script type="text/javascript" src="<%=prefix%>/assets/vendor.js"></script>
<script type="text/javascript" src="<%=prefix%>/assets/main.js"></script>
</body>`)
}

let { prefix } = config
prefix = !prefix
  ? ''
  : prefix === true
    ? `/${pkg.name}`
    : prefix === '/' ? '' : prefix

/**
 * @api /api/hello_text
 */
exports.helloText = function (req, callback) {
  let data = 'hello';
  callback(null, data, 'text');
};

/**
 * @api /*
 */
exports.welcomeTpl = function (req, callback) {
  const action = (title = '', description = '') => {
    callback(null, ejs.render(indexTemplate, {
        isDebug: config.debug,
        env: config.env,
        title,
        csrfToken: req.csrfToken(),
        description,
        prefix
    }, {
      filename: indexPath
    }), {
      type: 'raw',
      contentType: 'text/html'
    })
  }

  const match = req.path.match(`^/mm/([\\w\\d-]+)`)
  if (match) {
    // FOR url: /mm/1dbf6e89-92cb-4599-ade1-ee3a37075209, we get title from db
    req.getRequest('mindmap').get(`/jsonapi/form_mindmap/${match[1]}`, async (err, data = {}, res) => {

      const {selectId, selectedComment} = req.query
      // get text as title from db
      let title = ''
      let description = ''
      try {
        const json = JSON.parse(_.get(data, 'data.attributes.xjson'))
        title = '脑图:' + json.text
        const people = _.get(json, 'attrs.tasks.director.label')
        if (people) {
          description = `负责人:${people}`
        }
        const endDate = new Date(_.get(json, 'attrs.tasks.endValue'))
        if (endDate.getTime()) {
          description = `${moment(+endDate).format('MM/DD')}, ${description}`
        }

        if(selectId) {
          const selId = selectId.split(',')[0]
          const node = (flatNodes(json)[0] || []).find(x=>x.id === selId)
          if(node) {
            title = `${title} - ${node.text}`
          }
        }

        if(selectedComment) {
          let {body} = await req.getRequest('mindmap').get(`/jsonapi/form_mindComment/${selectedComment}`)
          if(_.isString) {
            try{
              body = JSON.parse(body)
            }catch(e){

            }
          }
          const {xcontent, xauthor, createAt, date} = _.get(body, 'data.attributes', {})
          if(xcontent) {
            description = `${_.get(xauthor, '_temp.text')} 评论： ${xcontent}`
          }
        }

      } catch (e) {
        console.log('get mindmap detail error:', e)
      }

      action(title, description)
    })
  } else {
    action()
  }
}


/**
 * 如需要使用原始的API, 请加上  nowrap 标记
 * @api {get} /api/login
 * @desc 获取用户信息
 */
exports.login = function (req, callback) {
  const mindmapService = req.getRequest('mindmap');
  const { password, username } = req.query;
  const params = {
    revertExclude: 0,
    'page[offset]': 0,
    'page[limit]': 20,
    'meta[onTop]': true,
    'meta[hideSel]': false,
    'filter[xusername]': username,
    'filter[xpassword]': password,
  }
  mindmapService.get('/jsonapi/form_mindUser?' + qs.stringify(params), (err, data = [], res) => {
    let returnData = {};
    // console.log('api/login--data->>>>', JSON.stringify(data), 'err->>', JSON.stringify(err));
    if (data.data && data.data.length) {
      const { attributes: { xusername }, id } = data.data[0]
      req.session.userInfo = { xusername, id };
      returnData.userInfo = { xusername, id };
    } else if (data.errors) {

      returnData.errors = data.errors;
    }
    callback(null, returnData || [], 'json');
  });
}


/**
 * @api {get} /api/isLogin
 * @desc 获取用户信息
 */
exports.isLogin = function (req, callback) {
  let userInfo = {}
  if (req.session.userInfo) {
    userInfo = { isLogin: true, ...req.session.userInfo }
  } else {
    userInfo = {
      isLogin: false
    }
  }

  callback(null, userInfo || [], 'json')
}

/**
 * @api {get} /api/logout
 * @desc 获取用户信息
 */
exports.logout = function (req, callback) {
  req.session.userInfo = null
  callback(null, { ok: 1 }, 'json');
}


/**
 * @api {get} /api/memberList
 * @desc 获取成员列表
 */
exports.memberList = function (req, callback) {
  const mindmapService = req.getRequest('mindmap');
  const params = {
    revertExclude: 1,
    'page[offset]': 0,
    'page[limit]': 200,
    'meta[onTop]': true,
    'meta[hideSel]': false,
    'meta[formtypes]': 1,
    'meta[formdatas]': 1,
    'fields[form_mindUser]': 'xusername,xemail'
  }
  mindmapService.get('/jsonapi/form_mindUser?' + qs.stringify(params), (err, data = [], res) => {
    let returnData = {}
    if (data.data && data.data.length) {
      returnData.memberList = data.data.map(v => {
        const { attributes: { xusername, xemail }, id } = v
        return { xusername, xemail, id }
      })
    } else if (data.errors) {
      returnData.errors = data.errors;
    }
    callback(null, returnData || [], 'json');
  });
}



/**
 * @api {post} /api/dingTalk
 * @desc 
 */
exports.dingTalk = function (req, callback) {
  const dingTalkService = req.getRequest('dingTalk');
  dingTalkService.post('/robot/send?access_token=d4badedb38e9a0e7a06e89c55af73f10646de27ef75da84fa8bbaec50747a283', {
    method: 'post',
    body: JSON.stringify(req.body)
  }, (err, data = [], res) => {
    console.log(data, '111')
    callback(null, data || [], 'json');
  });
}

// using SendGrid's v3 Node.js Library
// https://github.com/sendgrid/sendgrid-nodejs
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(
  process.env.SENDGRID_API_KEY ||
  _.get(config, 'extension.requestClient.config.email.token')
)

/**
 * @api {post} /api/email
 * @nowrap
 */
exports.email = function(req, res) {
  const json = {
    // to: 'test@example.com',
    from: _.get(config, 'extension.requestClient.config.email.from'),
    // subject: 'Sending with SendGrid is Fun',
    // text: 'and easy to do anywhere, even with Node.js',
    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    ...req.body
  }
  exports.memberList(req, (err, data)=>{
    if(err) {
      res.status(500).end(err.message)
    } else {
      const {to} = json
      const {memberList} = data
      const arr = memberList.filter(v=>to.indexOf(v.id) > -1)
      json.to = arr.map(v=>v.xemail).filter(Boolean)
      // console.log(json, to, memberList)
      if(!_.isEmpty(json.to)) {
        sgMail.send(json).then(()=>{
          res.json({ok: 1})
        }).catch(err=>{
          console.log(err.toString())
          res.status(500).end()
        })
      }
    }
  })
}
