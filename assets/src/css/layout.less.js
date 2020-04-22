const { prefix, isMobile } = require('../methods/util')
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
  obj: {
    ':root': {
      '--bg-color': '#cccccc',
      '--border-color': 'red'
    },
    html: {
      height: '100%',
      overflow: 'hidden'
    },
    body: {
      height: '100%',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif',
      WebkitFontSmoothing: 'antialiased'
    },
    '#root': {
      height: '100%'
    },
    '.blink_me': {
      animation: 'blinker 1s linear 2'
    },
    '@keyframes blinker': {
      '50%': {
        opacity: 0.5
      }
    },
    '@-webkit-keyframes panelmove':
    {
      'from': { left: '0px' },
      'to': { left: '300px' }
    },
    '.app': {
      // border: '1px solid var(--border-color)'
    },
    '.main-theme': {},
    '.nav-top': {
      display: 'flex',
      alignItems: 'center',
      height: '50px',
      borderBottom: '1px solid #ccc',
      backgroundColor: '#FAFAFA!important',
      '>*': {
        marginRight: '10px'
      },
    },
    '.content-wrapper': {
      height: 'calc(100vh - 56px)',
      display: 'flex'
    },
    '.outline-editor': {
      height: '100%',
      flex: 1,
      overflow: 'auto',
    },
    '.outline-top': {
      height: '30px',
      display: 'flex',
      padding: 8,
      position: 'fixed',
      left: 0,
      top: 20,
    },
    '.outline-dragger': {
      cursor: 'col-resize',
      width: '3px',
      borderRight: '1px solid #dcdcdc'
    },
    '.outline-wrapper': {
      flexBasis: '50px',
      flexFlow: 'column',
      borderRight: '1px solid #cccccc',
      display: 'none',
      backgroundColor: '#FAFAFA!important',
      '&.showOutline': {
        display: 'flex'
      },
    },
    '.action-panel-wrapper': {
      borderLeft: '1px solid #dcdcdc',
      position: 'relative',
      display: 'flex',
      backgroundColor: '#FAFAFA',
    },
    '.action-content': {
      display: 'none'
    },
    '.showActionPanel': {
      borderRight: '1px solid #dcdcdc',
      display: 'block',
      minWidth: '240px',
      maxWidth: '300px',
      overflowY: 'auto',
      overflowX: 'hidden',
    },
    '.time-msg': {
      padding: '8px 0'
    },
    '.action-menu': {
      width: '60px',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'center',
      backgroundColor: '#FAFAFA',
      'i': {
        width: '18px',
        height: '18px'
      },
    },
    '.action-menu span': {
      textAlign: 'center',
      padding: '16px 0',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#eeeeee',
      },
      'i': {
        display: 'inline-block',
        width: '18px',
        height: '18px',
      }
    },
    '.selected-tab': {
      'i': {
        color: '#005FCE'
      }
    },
    '.main-wrapper': {
      flexGrow: 1,
      position: 'relative',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch',
    },
    '.mindmap-wrapper': {
      position: 'absolute',
      width: 'fit-content',
      willChange: 'transform',
    },
    '.root-node-wrapper': {
      display: 'flex',
      alignItems: 'center',
      width: 'max-content',
    },
    '.sub-node-wrapper': {
      // position: 'relative',
      display: 'flex',
      alignItems: 'center',
      '&:hover': {
        '.toggle_button': {
          display: 'block'
        }
      },
    },
    '.node-time-title': {
      display: 'flex',
      margin: 0,
      padding: 0,
      'h4': {
        // marginLeft: '10px',
        padding: 0,
      }
    },
    '.node-root': {
      textDecoration: 'underline',
      fontWeight: 'bold'
    },
    '.node-time': {
      textAlign: 'center',
      border: '1px solid #ccc',
      borderRadius: '16px',
      padding: '2px 8px',
      fontSize: '12px',
      fontWeight: 'normal',
    },
    '.node-action-style': {
      // padding: '8px'
    },
    '.node-font-family': {
      padding: '8px 0'
    },
    '.node-font-style': {
      display: 'flex',
      padding: '8px 0',
      fontSize: '18px',
      fontWeight: 'bold',
    },
    '.node-font-style span': {
      flex: 1,
      textAlign: 'center',
      fontSize: '8px',
      verticalAlign: 'middle',
      lineHeight: '20px',
      cursor: 'pointer'
    },
    '.icon-action': {
      position: 'relative',
      backgroundColor: '#fff',
      zIndex: 999,
      'span': {
        marginRight: '30px',
        backgroundColor: '#fff',
        'i': {
          width: '16px',
          height: '16px',
          '&:hover': {
            color: '#005FCE'
          }
        }
      },

    },
    '.icon_action_three': {
      position: 'absolute!important',
      bottom: '-30px!important',
      minWidth: '144px',
      left: '10px',
      'span': {
        marginRight: '20px',
      }
    },
    '.input-wrapper': {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      width: 'fit-content',
      minWidth: '1em',
      maxWidth: '10em',
      height: 'fit-content',
      margin: 'auto',
      padding: '10px',
      color: '#333333',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 20px #aaaaaa',
      borderRadius: '10px',
      outline: 'none',
      zIndex: 9999,
      userSelect: 'text'
    },
    '.line-canvas-wrapper': {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: -2
    },
    '.toolbar-wrapper-nav': {
      display: 'flex',
      width: 'max-content',
      height: '50px',
      padding: '0 8px',
      fontSize: '20px',
      marginLeft: '10px',
      alignItems: 'center',
      'span:hover': {
        backgroundColor: 'rgba(238,238,238)'
      }
    },
    '.toolbar-wrapper': {
      display: 'flex',
      position: 'absolute',
      bottom: 'calc(100% + 5px)',
      left: 0,
      backgroundColor: ['#ffffff', '#ffffff'],
      width: 'max-content',
      height: '50px',
      padding: '0 8px',
      fontSize: '20px',
      borderRadius: '10px',
      boxShadow: '5px 5px 10px #aaaaaa'
    },
    '.tool-button-wrapper': {
      margin: '0 0.12em',
      padding: '0 0.24em',
      backgroundColor: 'transparent',
      border: 'none',
      outline: 'none',
      cursor: 'pointer',
      width: 'fit-content',
      i: {
        display: 'block',
        marginBottom: '0.12em',
        fontSize: '100%'
      },
      span: {
        display: 'block',
        fontSize: '25%'
      },
      '&:active': {
        transform: 'scale(0.95)'
      },
      '&:hover': {}
    },
    '.disabled_style': {
      '&, &:hover': {
        color: '#cccccc'
      },
      cursor: 'not-allowed'
    },
    '.left_style': {
      flexDirection: 'row-reverse'
    },
    '.common_style': {
      position: 'relative',
      // minWidth: '204px',
      margin: '20px 50px',
      padding: '12px 8px 8px',
      backgroundColor: '#ffffff!important',
      borderRadius: '15px',
      cursor: 'pointer',
      borderColor: '#eda938',
      p: {
        minHeight: '18px',
        margin: 0,
        lineHeight: '1.5em',
        overflowWrap: 'break-word'
      },
    },
    '.specific_style0': {
      'div&': {
        padding: '15px 20px',
        color: '#000000',
        // width: '50px!important',
        fontSize: '120%',
        fontWeight: 700,
      },
      'h4': { marginBottom: '0px' },
      '.node-time-title': {
        'div': {
          marginRight: '0!important'
        }

      }
    },
    '.specific_style1': { 'h4': { marginBottom: '4px', } },
    '.specific_style2': { 'h4': { marginBottom: '0px', } },
    '.specific_style3': {
      borderBottom: '2px solid #e79021!important',
      minWidth: 'auto',
      bottom: '10px',
      borderRadius: 4,
    },
    '.seleted_style': {
      zIndex: 1
    },
    '.drop_area': {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 0,
      minHeight: 20
    },
    '.drag_canvas_wrapper': {
      position: "absolute",
      top: 0,
      left: 0,
      'z-index': -1,
    },
    '.toggle_button': {
      display: 'none',
      position: 'absolute',
      zIndex: 9999,
      top: 0,
      bottom: 0,
      width: '20px',
      height: '20px',
      margin: 'auto 0',
      padding: 0,
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: '1px solid #cccccc',
      borderRadius: '50%',
      outline: 'none',
      cursor: 'pointer',
      '&.show_plus': {
        display: 'block'
      }
    },
    '.button_left': {
      left: '-15px'
    },
    '.button_right': {
      right: '-15px'
    },
    'div.hide_children': {
      visibility: 'hidden',
      height: 0,
      overflow: 'hidden'
    },
    '.ondrag': {
      borderColor: 'red'
    },
    '.login': {
      width: '100%',
      height: '100%',
      backgroundImage: `url(${prefix}/assets/static/img/login-background.png)`,
      'background-size': '100% 100%',
      backgroudRepeat: 'none',
    },
    '.login-form-box': {
      width: '28%',
      height: '56%',
      minWidth: '400px',
      minHeight: '500px',
      position: 'absolute',
      top: '46%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
    '.quick_add': {
      display: 'block',
      color: '#ff5858',
      borderColor: '#ff5858'
    },
    '.coop_users_tip': {
      position: 'absolute',
      top: -25,
      left: 8,
      color: 'green',
      fontSize: 8
    },
    '.hidden': {
      display: 'none'
    },
    '.flex': {
      display: 'flex'
    },
    'div.selectId': {
      boxShadow: '0 0 0 3px #ffffff, 0 0 0 6px #2942ce',
      backgroundColor: '#f4cc87!important',
    },
    '.nodeActionWrap': {
      display: 'relative', zIndex: 99999, display: 'flex',
      '&>*': {
        marginLeft: isMobile.any ? 22 : 10,
      }
    },
    '.commentHighlight': {
      color: 'blue'
    },
  },
  classes: {
    commentHighlight: 'commentHighlight',
    nodeActionWrap: 'nodeActionWrap',
    selectId: 'selectId',
    flex: 'flex',
    hidden: 'hidden',
    blink_me: 'blink_me',
    app: 'app',
    coop_users_tip: 'coop_users_tip',
    'main-theme': 'main-theme',
    'nav-top': 'nav-top',
    'nav-save': 'nav-save',
    'content-wrapper': 'content-wrapper',
    'outline-editor': 'outline-editor',
    'outline-top': 'outline-top',
    'outline-dragger': 'outline-dragger',
    'outline-wrapper': 'outline-wrapper',
    showOutline: 'showOutline',
    'main-wrapper': 'main-wrapper',
    'mindmap-wrapper': 'mindmap-wrapper',
    'root-node-wrapper': 'root-node-wrapper',
    'sub-node-wrapper': 'sub-node-wrapper',
    toggle_button: 'toggle_button',
    'input-wrapper': 'input-wrapper',
    'line-canvas-wrapper': 'line-canvas-wrapper',
    'toolbar-wrapper-nav': 'toolbar-wrapper-nav',
    'toolbar-wrapper': 'toolbar-wrapper',
    'tool-button-wrapper': 'tool-button-wrapper',
    disabled_style: 'disabled_style',
    left_style: 'left_style',
    common_style: 'common_style',
    ondrag: 'ondrag',
    specific_style0: 'specific_style0',
    specific_style1: 'specific_style1',
    specific_style2: 'specific_style2',
    specific_style3: 'specific_style3',
    seleted_style: 'seleted_style',
    drop_area: 'drop_area',
    show_plus: 'show_plus',
    button_left: 'button_left',
    button_right: 'button_right',
    quick_add: 'quick_add',
    hide_children: 'hide_children',
    'icon-action': 'icon-action',
    'action-panel-wrapper': 'action-panel-wrapper',
    'action-menu': 'action-menu',
    'action-content': 'action-content',
    'showActionPanel': 'showActionPanel',
    'node-action-style': 'node-action-style',
    'node-font-family': 'node-font-family',
    'node-font-style': 'node-font-style',
    'selected-tab': 'selected-tab',
    'node-root': 'node-root',
    'node-time-title': 'node-time-title',
    'time-msg': 'time-msg',
    'node-time': 'node-time',
    'login': 'login',
    'login-form-box': 'login-form-box',
    'login-form': 'login-form',
    'icon_action_three': 'icon_action_three',
    'drag_canvas_wrapper': 'drag_canvas_wrapper',
    'icon-task': 'icon-task',
    'disabled-icon': 'disabled-icon',
  },
  ids: {},
}
