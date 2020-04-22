import { THEME_MAIN, THEME_EX, THEME_ASSIST, THEME_LIGHT, THEME_DARK } from '../statics/refer'

const style_selected_border = {
  boxShadow: `0 0 0 3px #ffffff, 0 0 0 6px var(${THEME_EX})` /* 双层阴影实现选中框 */
}

export default (theme) => ({
  '.main-theme': {
    [THEME_MAIN]: theme.main,
    [THEME_LIGHT]: theme.light,
    [THEME_ASSIST]: theme.assist,
    [THEME_DARK]: theme.dark,
    [THEME_EX]: theme.ex
  },
  '.common_style': {
    border: `1px solid var(${THEME_MAIN})`,
    '&:hover': {
      ...style_selected_border,
    },
    '&.ondrag': {
      backgroundColor: `var(${THEME_EX})`
    }
  },
  '.seleted_style': {
    ...style_selected_border
  },
  '.specific_style0': {
    'div&': {
      backgroundColor: `var(${THEME_DARK})`,
      border: `2px solid var(${THEME_EX})`
    }
  },
  '.specific_style1': {
    'div&': {
      backgroundColor: `var(${THEME_LIGHT})`
    }
  },
  '.specific_style2': {
    'div&': {
      padding: `10px 15px`
    }
  },
  '.specific_style3': {
    'div&': {
      padding: `0 15px;`,
      border: `none`,
      p: {
        fontSize: `90%`
      }
    }
  },
  '.tool-button-wrapper': {
    '&:hover':{
      color: `var(${THEME_ASSIST})`
    }
  }
})

