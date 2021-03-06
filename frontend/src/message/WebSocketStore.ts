import { IMessage } from '@interfaces/interface'
import { AxiosError } from 'axios'

import * as config from '../configuration'
import { SnackReporter } from '../snack/SnackManager'
import { AuthStore } from '../stores/authentication.store'

export class WebSocketStore {
  private wsActive = false
  private ws: WebSocket | null = null

  public constructor (private readonly snack: SnackReporter, private readonly authenticationStore: AuthStore) {}

  public listen = (callback: (msg: IMessage) => void) => {
    if (!this.authenticationStore.token() || this.wsActive) {
      return
    }
    this.wsActive = true

    const wsUrl = config.get('url').replace('http', 'ws').replace('https', 'wss')
    const ws = new WebSocket(wsUrl + 'stream?token=' + this.authenticationStore.token())

    ws.onerror = (e) => {
      this.wsActive = false
      console.log('WebSocket connection errored', e)
    }

    ws.onmessage = (data) => callback(JSON.parse(data.data))

    ws.onclose = () => {
      this.wsActive = false
      this.authenticationStore
        .tryAuthenticate()
        .then(() => {
          this.snack('WebSocket connection closed, trying again in 30 seconds.')
          setTimeout(() => this.listen(callback), 30000)
        })
        .catch((error: AxiosError) => {
          if (error && error.response && error.response.status === 401) {
            this.snack('Could not authenticate with client token, logging out.')
          }
        })
    }

    this.ws = ws
  }

  public close = () => this.ws && this.ws.close(1000, 'WebSocketStore#close')
}
