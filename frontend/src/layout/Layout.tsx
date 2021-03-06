import { IVersion } from '@interfaces/interface'
import { createMuiTheme, MuiThemeProvider, Theme, WithStyles, withStyles } from '@material-ui/core'
import CssBaseline from '@material-ui/core/CssBaseline'
import axios, { AxiosResponse } from 'axios'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import * as React from 'react'
import { HashRouter, Redirect, Route, Switch } from 'react-router-dom'
import { AvailableStores } from 'stores/inject-stores.interface'

import Applications from '../application/Applications'
import Clients from '../client/Clients'
import { ConnectionErrorBanner } from '../common/ConnectionErrorBanner'
import LoadingSpinner from '../common/LoadingSpinner'
import ScrollUpButton from '../common/ScrollUpButton'
import SettingsDialog from '../common/SettingsDialog'
import * as config from '../configuration'
import Messages from '../message/Messages'
import PluginDetailView from '../plugin/PluginDetailView'
import Plugins from '../plugin/Plugins'
import SnackBarHandler from '../snack/SnackBarHandler'
import { inject } from '../stores/inject-stores'
import { Stores } from '../stores/inject-stores.interface'
import Login from '../user/login'
import Users from '../user/users'
import Header from './Header'
import Navigation from './Navigation'

const styles = (theme: Theme) => ({
  content: {
    margin: '0 auto',
    marginTop: 64,
    padding: theme.spacing(4),
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      marginTop: 0
    }
  }
})

const localStorageThemeKey = 'gotify-theme'
type ThemeKey = 'dark' | 'light'
const themeMap: Record<ThemeKey, Theme> = {
  light: createMuiTheme({
    palette: {
      type: 'light'
    }
  }),
  dark: createMuiTheme({
    palette: {
      type: 'dark'
    }
  })
}

const isThemeKey = (value: string | null): value is ThemeKey => {
  return value === 'light' || value === 'dark'
}

@observer
class Layout extends React.Component<WithStyles<'content'> & Stores<AvailableStores.AUTH_STORE | 'snackManager'>> {
  private static defaultVersion = '0.0.0'

  @observable
  private currentTheme: ThemeKey = 'dark'
  @observable
  private showSettings = false
  @observable
  private version = Layout.defaultVersion
  @observable
  private navOpen = false

  private setNavOpen (open: boolean) {
    this.navOpen = open
  }

  public componentDidMount () {
    if (this.version === Layout.defaultVersion) {
      axios.get(config.get('url') + 'version').then((resp: AxiosResponse<IVersion>) => {
        this.version = resp.data.version
      })
    }

    const localStorageTheme = window.localStorage.getItem(localStorageThemeKey)
    if (isThemeKey(localStorageTheme)) {
      this.currentTheme = localStorageTheme
    } else {
      window.localStorage.setItem(localStorageThemeKey, this.currentTheme)
    }
  }

  public render () {
    const { version, showSettings, currentTheme } = this
    const { classes,
      [AvailableStores.AUTH_STORE]: { loggedIn,
        authenticating,
        user: { name, admin },
        logout,
        tryReconnect,
        connectionErrorMessage } } = this.props
    const theme = themeMap[currentTheme]
    const loginRoute = () => (loggedIn ? <Redirect to="/" /> : <Login />)
    return (
      <MuiThemeProvider theme={theme}>
        <HashRouter>
          <div>
            {!connectionErrorMessage ? null : <ConnectionErrorBanner height={64} retry={() => tryReconnect()} message={connectionErrorMessage} />}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <CssBaseline />
              <Header
                style={{ top: !connectionErrorMessage ? 0 : 64 }}
                admin={admin}
                name={name}
                version={version}
                loggedIn={loggedIn}
                toggleTheme={this.toggleTheme.bind(this)}
                showSettings={() => (this.showSettings = true)}
                logout={logout}
                setNavOpen={this.setNavOpen.bind(this)}
              />
              <div style={{ display: 'flex' }}>
                <Navigation loggedIn={loggedIn} navOpen={this.navOpen} setNavOpen={this.setNavOpen.bind(this)} />
                <main className={classes.content}>
                  <Switch>
                    {authenticating ? (
                      <Route path="/">
                        <LoadingSpinner />
                      </Route>
                    ) : null}
                    <Route exact path="/login" render={loginRoute} />
                    {loggedIn ? null : <Redirect to="/login" />}
                    <Route exact path="/" component={Messages} />
                    <Route exact path="/messages/:id" component={Messages} />
                    <Route exact path="/applications" component={Applications} />
                    <Route exact path="/clients" component={Clients} />
                    <Route exact path="/users" component={Users} />
                    <Route exact path="/plugins" component={Plugins} />
                    <Route exact path="/plugins/:id" component={PluginDetailView} />
                  </Switch>
                </main>
              </div>
              {showSettings && <SettingsDialog fClose={() => (this.showSettings = false)} />}
              <ScrollUpButton />
              <SnackBarHandler />
            </div>
          </div>
        </HashRouter>
      </MuiThemeProvider>
    )
  }

  private toggleTheme () {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(localStorageThemeKey, this.currentTheme)
  }
}

export default withStyles(styles, { withTheme: true })(inject<any>(AvailableStores.AUTH_STORE, 'snackManager')(Layout))
