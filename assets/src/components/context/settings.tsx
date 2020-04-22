// https://medium.com/simply/state-management-with-react-hooks-and-context-api-at-10-lines-of-code-baf6be8302c

import React, { createContext, useContext, useReducer } from 'react'

// ----- settings ----
const initSettings = {
    theme: {
        background: '#fff'
    }
}

export const ThemeActions = {
    changeTheme: 'changeTheme'
}

const reducer = (state, action) => {
    switch (action.type) {
        case ThemeActions.changeTheme: {
            return {
                ...state,
                theme: {
                    ...state.theme,
                    ...action.data
                }
            }
        }
        default:
            return state
    }
}

const SettingContext = createContext([])
export const SettingProvider = ({ children }) => (
    <SettingContext.Provider value={useReducer(reducer, initSettings)}>
        {children}
    </SettingContext.Provider>
)
export const useSettingContext = () => useContext(SettingContext)
