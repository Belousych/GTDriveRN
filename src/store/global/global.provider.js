import {ApplicationProvider} from '@ui-kitten/components';
import {useMemo, useReducer} from 'react';
import {globalActionTypes as actions} from './global.actions';
import {globalReducer} from './global.reducer';
import {GlobalState} from './global.state';

import * as eva from '@eva-design/eva';

const GLOBAL_STATE = {
  isLoggedIn: undefined,
  theme: 'light',
  isModalOpen: false,
  enabledGeo: false,
  location: null,
};

export const GlobalStateProvider = ({children}) => {
  const [state, dispatch] = useReducer(globalReducer, GLOBAL_STATE);

  const value = useMemo(
    () => ({
      ...state,
      login: () => {
        dispatch({type: actions.LOGIN});
      },
      logout: () => {
        dispatch({type: actions.LOGOUT});
      },
      setLightTheme: () => {
        dispatch({type: actions.LIGHT_THEME});
      },
      setDarkTheme: () => {
        dispatch({type: actions.DARK_THEME});
      },
      openModal: () => {
        dispatch({type: actions.OPEN_MODAL});
      },
      closeModal: () => {
        dispatch({type: actions.CLOSE_MODAL});
      },
      enableGeo: () => {
        dispatch({type: actions.ENABLE_GEO});
      },
      disableGeo: () => {
        dispatch({type: actions.s});
      },
      setLocation: location => {
        dispatch({type: actions.SET_LOCATION, payload: location});
      },
    }),
    [state, dispatch],
  );

  const {theme} = state;

  // Wrap the context provider around our component
  return (
    <ApplicationProvider {...eva} theme={eva[theme]}>
      <GlobalState.Provider value={value}>{children}</GlobalState.Provider>
    </ApplicationProvider>
  );
};
