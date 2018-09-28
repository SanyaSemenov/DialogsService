const AlignOptionsEnum = Object.freeze({
  "space_between": 1,
  "left": 2,
  "right": 3
});

const DialogMode = Object.freeze({
  "alert": 1,
  "confirm": 2
});

class AlertService {
  constructor(options) {
    if (typeof options === 'undefined') {
      this.button_row_class = 'button-row';
      this.buttons_align = AlignOptionsEnum.space_between;
      this.alert_id = 'alert_window';
      this.alert_wrapper_class = 'alert-wrapper';
      this.alert_class = 'alert';
      this.title_id = 'alert_title';
      this.title_class = 'alert-title';
      this.message_id = 'alert_message';
      this.message_class = 'alert-message';
      this.isHard = true;
      this.hideOverflow = true;
      this._title = '';
      this._message = '';
    } else {
      this.button_row_class = options['button_row_class'] ? options['button_row_class'] : 'button-row';
      this.buttons_align = options['buttons_align'] ? options['buttons_align'] : AlignOptionsEnum.space_between;
      this.alert_id = options['alert_id'] ? options['alert_id'] : 'alert_window';
      this.alert_wrapper_class = options['alert_wrapper_class'] ? options['alert_wrapper_class'] : 'alert-wrapper';
      this.alert_class = options['alert_class'] ? options['alert_class'] : 'alert';
      this.title_id = options['title_id'] ? options['title_id'] : 'alert_title';
      this.title_class = options['title_class'] ? options['title_class'] : 'alert-title';
      this.message_id = options['message_id'] ? options['message_id'] : 'alert_message';
      this.message_class = options['message_class'] ? options['message_class'] : 'alert-message';
      this.isHard = typeof options['isHard'] !== 'undefined' ? options['isHard'] : true;
      this.hideOverflow = typeof options['hideOverflow'] !== 'undefined' ? options['hideOverflow'] : true;
      this._title = options['title'] ? options['title'] : '';
      this._message = options['message'] ? options['message'] : '';
    }
    this._checkForExistingId();
    this._cancel_btn_style = '';
    this._confirm_btn_style = '';
    this._setButtonsStyle();
    this._isOpened = false;
    this._isInitialized = false;
    this.body = null;
    this.alertElement = null;
    this.alertTitle = null;
    this.alertMessage = null;
    this.confirm_btn = null;
    this.cancel_btn = null;
    this.mode = 2;
    this.Init();
  }

  get title() {
    return this._title ? this._title : '';
  }

  set title(value) {
    this._title = value ? value : '';
    if (this.isOpened) {
      this.Update();
    }
  }

  get message() {
    return this._message ? this._message : '';
  }

  set message(value) {
    this._message = value ? value : '';
    if (this.isOpened) {
      this.Update();
    }
  }

  get isInitialized() {
    return this._isInitialized;
  }

  get isOpened() {
    return this._isOpened;
  }

  set isOpened(value) {
    if (typeof value === 'boolean') {
      this._isOpened = value;
    } else {
      throw new Error('Type must be Boolean');
    }
  }

  /**
   * Returns Promise when alert is closed with boolean resolve value.
   * true means that confirm button was clicked;
   * null means that user clicked outside the dialog window
   * @param {string} title title of alert dialog
   * @param {string} message message of alert dialog
   */
  alert(title, message) {
    this.title = title;
    this.message = message;
    this.mode = DialogMode.alert;
    return this._openDialog();
  }

  /**
   * Returns Promise when confirm is closed with boolean resolve value.
   * true means that confirm button was clicked;
   * false means that cancel button was clicked;
   * null means that user clicked outside the dialog window
   * @param {string} title title of confirm dialog
   * @param {string} message message of confirm dialog
   */
  confirm(title, message) {
    this.title = title;
    this.message = message;
    this.mode = DialogMode.confirm;
    return this._openDialog();
  }

  _openDialog() {
    if (this.isOpened) {
      return new Promise((resolve, reject) => {
        reject('Close dialog before opening new instance');
      })
    }
    return new Promise((resolve, reject) => {
      if (this.isInitialized) {
        if (this.hideOverflow) {
          this.body.classList.add('overflow-hidden');
        }
        if (this.isHard) { // hard open (render html od alert window)
          const html = this.renderHTML(this.title, this.message);
          this.body.innerHTML += html;
          const alert = document.getElementById(this.alert_id);
          this.confirm_btn = alert.querySelector('.confirm-btn');
          this.cancel_btn = alert.querySelector('.cancel-btn');
          alert.classList.add('opened');
          try {
            alert.children[0].onclick = (e) => {
              this.closeDialog();
              resolve(null);
            };
          } catch (ex) {
            reject(ex);
          }
        } else { // soft open (add class to alert)
          if (!this.cancel_btn && this.mode === DialogMode.alert) {
            this.cancel_btn = this.alertElement.querySelector('.cancel-btn');
            this.cancel_btn.style.display = 'none';
          }
          this.alertElement.classList.add('opened');
          try {
            this.alertElement.children[0].onclick = (e) => {
              this.closeDialog();
              resolve(null);
            };
          } catch (ex) {
            reject(ex);
          }
        }

        this.isOpened = true; // set open status

        try { // binding click events on buttons
          this.confirm_btn.onclick = (e) => {
            this.closeDialog();
            resolve(true);
          };
          if (this.mode === DialogMode.confirm) {
            this.cancel_btn = document.querySelector(`#${this.alert_id} .cancel-btn`);
            this.cancel_btn.onclick = (e) => {
              this.closeDialog();
              resolve(false);
            };
          }
        } catch (ex) {
          reject(ex);
        }

        if (this.isOpened) { // means that this is update
          if (this.isHard) { // alertTitle and alertMessage DOM elements are not defined
            const title = document.getElementById(this.title_id);
            const message = document.getElementById(this.message_id);
            title.innerHTML = this.title;
            message.innerHTML = this.message;
          } else { // alertTitle and alertMessage are defined
            this.alertTitle.innerHTML = this.title;
            this.alertMessage.innerHTML = this.message;
          }
        }
      } else {
        return new Promise((resolve, reject) => {
          reject('dialog isn\'t initialized');
        })
      }
    });
  }

  closeDialog() {
    if (this.isInitialized) {
      if (this.hideOverflow) {
        this.body.classList.remove('overflow-hidden');
      }
      if (this.isHard) { // hard remove html from DOM
        const child = document.getElementById(this.alert_id);
        this.body.removeChild(child);
      } else { // soft close (remove class from alert)
        this.alertElement.classList.remove('opened');
      }
      this.isOpened = false;
    }
  }

  _checkForExistingId() {
    const alert = document.getElementById(this.alert_id);
    const title = document.getElementById(this.title_id);
    const message = document.getElementById(this.message_id);
    if (alert !== null) {
      throw new Error('alert already exists. Please specify new alert\'s and its components\' identificators');
    }
    if (title !== null) {
      throw new Error('alert already exists. Please specify new title\'s identificator');
    }
    if (message !== null) {
      throw new Error('alert already exists. Please specify new message\'s identificator');
    }
  }

  Update() {
    if (this.isHard && this.isOpened) { // hard update (replace alert with new data)
      this.closeDialog();
      this._openDialog();
    } else if (!this.isHard && this.isOpened) { // soft update (change innerHTML of alertTitle and alertMessage)
      this.alertTitle.innerHTML = this.title;
      this.alertMessage.innerHTML = this.message;
    }
  }

  Init() {
    this.body = document.body;
    if (!this.isHard) { // soft init (definig dom elements)
      this.body.innerHTML += this.renderHTML(this.title, this.message);
      this.alertElement = document.getElementById(this.alert_id);
      this.alertTitle = document.getElementById(this.title_id);
      this.alertMessage = document.getElementById(this.message_id);
      this.confirm_btn = this.alertElement.querySelector('.confirm-btn');
      this.cancel_btn = this.alertElement.querySelector('.cancel-btn');
    }
    this._isInitialized = true;
  }

  _setButtonsStyle() {
    const left = 'float: left';
    const right = 'float: right';
    switch (this.buttons_align) {
      case AlignOptionsEnum.left:
        this._cancel_btn_style = left;
        this._confirm_btn_style = left;
        break;
      case AlignOptionsEnum.right:
        this._cancel_btn_style = right;
        this._confirm_btn_style = right;
        break;
      case AlignOptionsEnum.space_between:
        this._cancel_btn_style = left;
        this._confirm_btn_style = right;
        break;
    }
  }

  renderHTML(title, message) {
    const confirmHTML = this.mode === DialogMode.confirm ?
      `<div class="cancel-btn" style="${this._cancel_btn_style}">
        <button>Cancel</button>
      </div>` : ``;
    return `<div class="${this.alert_wrapper_class}" id="${this.alert_id}">
              <div style="position: absolute; top: 0; left: 0; bottom: 0; right: 0; width: 100vw; height: 100vh;"></div>
              <div class="${this.alert_class}">
                <p class="${this.title_class}" id="${this.title_id}">${title}</p>
                <p class="${this.message_class}" id="${this.message_id}">${message}</p>
                <div class="${this.button_row_class}">
                  <div class="confirm-btn" style="${this._confirm_btn_style}">
                    <button>Ok</button>
                  </div>
                  ${confirmHTML}
                </div>
              </div>
            </div>`;
  }
}

// TODO: create access to buttons to set click event handlers on them && pass callback