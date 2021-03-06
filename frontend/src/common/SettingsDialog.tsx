import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import TextField from '@material-ui/core/TextField'
import Tooltip from '@material-ui/core/Tooltip'
import { observable } from 'mobx'
import { observer } from 'mobx-react'
import React, { Component } from 'react'

import { inject } from '../stores/inject-stores'
import { Stores, AvailableStores } from '../stores/inject-stores.interface'

interface IProps {
  fClose: VoidFunction
}

@observer
class SettingsDialog extends Component<IProps & Stores<AvailableStores.AUTH_STORE>> {
  @observable
  private pass = ''

  public render () {
    const { pass } = this
    const { fClose } = this.props
    const submitAndClose = () => {
      this.props[AvailableStores.AUTH_STORE].changePassword(pass)
      fClose()
    }
    return (
      <Dialog open={true} onClose={fClose} aria-labelledby="form-dialog-title" id="changepw-dialog">
        <DialogTitle id="form-dialog-title">Change Password</DialogTitle>
        <DialogContent>
          <TextField className="newpass" autoFocus margin="dense" type="password" label="New Password *" value={pass} onChange={(e) => (this.pass = e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={fClose}>Cancel</Button>
          <Tooltip title={pass.length !== 0 ? '' : 'Password is required'}>
            <div>
              <Button className="change" disabled={pass.length === 0} onClick={submitAndClose} color="primary" variant="contained">
                Change
              </Button>
            </div>
          </Tooltip>
        </DialogActions>
      </Dialog>
    )
  }
}

export default inject(AvailableStores.AUTH_STORE)(SettingsDialog)
