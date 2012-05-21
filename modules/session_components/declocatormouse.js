/* -*- Mode: JAVASCRIPT; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 4 -*-
 *
 * ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is tanasinn
 *
 * The Initial Developer of the Original Code is
 * Hayaki Saito.
 * Portions created by the Initial Developer are Copyright (C) 2010 - 2011
 * the Initial Developer. All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 *
 * @class WheelScroll
 *
 *
 */
let WheelScroll = new Class().extends(Plugin);
WheelScroll.definition = {

  get id()
    "wheel_scroll",

  get info()
    <plugin>
        <name>{_("Wheel Scroll")}</name>
        <description>{
          _("Handle Wheel/Touch scroll event.")
        }</description>
        <version>0.1</version>
    </plugin>,

  "[persistable] enabled_when_startup": true,

  /** Installs itself. */
  "[install]":
  function install(broker) 
  {
    /** Start to listen mouse event. */
    this.onMouseTrackingTypeChanged.enabled = true;
    this.onMouseTrackingModeChanged.enabled = true;

    this.onmousescroll.enabled = true;
  },

  /** Uninstalls itself. */
  "[uninstall]":
  function uninstall(broker) 
  {
    // unregister mouse event DOM listeners.
    this.onMouseTrackingTypeChanged.enabled = false;
    this.onMouseTrackingModeChanged.enabled = false;

    this.onmousescroll.enabled = false;
  },

  /** Fired at the mouse tracking mode is changed. */
  "[subscribe('event/mouse-tracking-mode-changed')]":
  function onMouseTrackingModeChanged(data) 
  {
  },

  /** Fired at the mouse tracking type is changed. */
  "[subscribe('event/mouse-tracking-type-changed')]":
  function onMouseTrackingTypeChanged(data) 
  {
  },

  /** Fired at the locator reporting mode is changed. */
  "[subscribe('command/change-locator-reporting-mode'), enabled]": 
  function onChangeLocatorReportingMode(mode) 
  {
  },

  /** Mouse down evnet listener */
  "[listen('DOMMouseScroll', '#tanasinn_content')]": 
  function onmousescroll(event) 
  {
    if(event.axis === event.VERTICAL_AXIS) {

      let count = event.detail;
      if (event.hasPixels) {
        let line_height = renderer.line_height;
        count = Math.round(count / line_height + 0.5);
      } else {
        count = Math.round(count / 2);
      }
      if (0 == count) {
        return;
      }

      let broker = this._broker;

//      if (this._in_scroll_session) {
        if (count > 0) {
          broker.notify("command/scroll-down-view", count);
          broker.notify("command/draw");
        } else if (count < 0) {
          broker.notify("command/scroll-up-view", -count);
          broker.notify("command/draw");
        } else { // count == 1
          return;
        }
      }
//    }
  },

}; // class WheelScroll

/**
 * @class DECLocatorMouse
 *
 */
let DECLocatorMouse = new Class().extends(Plugin).depends("renderer");
DECLocatorMouse.definition = {

  get id()
    "dec_locator_mouse",

  get info()
    <plugin>
        <name>{_("DEC Locator Mouse")}</name>
        <description>{
          _("Send DEC Locator mouse input events to TTY device.")
        }</description>
        <version>0.1</version>
    </plugin>,

  "[persistable] enabled_when_startup": true,

  _locator_reporting_mode: null,
  _locator_buttonup_reporting: true,
  _locator_buttondown_reporting: true,
  _locator_state: 0,
  _locator_event: null,
  _in_scroll_session: false,


  /** Installs itself. */
  "[install]":
  function install(broker) 
  {
    /** Start to listen mouse event. */
    this.onmousedown.enabled = true;
    this.onmousemove.enabled = true;
    this.onmouseup.enabled = true;
    this.onMouseTrackingTypeChanged.enabled = true;
    this.onMouseTrackingModeChanged.enabled = true;
    this.backup.enabled = true;
    this.restore.enabled = true;
  },

  /** Uninstalls itself. */
  "[uninstall]":
  function uninstall(broker) 
  {
    // unregister mouse event DOM listeners.
    this.onmousedown.enabled = false;
    this.onmousemove.enabled = false;
    this.onmouseup.enabled = false;
    this.onMouseTrackingTypeChanged.enabled = false;
    this.onMouseTrackingModeChanged.enabled = false;
    this.backup.enabled = false;
    this.restore.enabled = false;
    this._locator_event = null;

    this.onmousescroll.enabled = false;
  },

  "[subscribe('command/backup')]": 
  function backup(context) 
  {
    context.decmouse = {
      locator_reporting_mode: this._locator_reporting_mode,
    }; 
  },

  "[subscribe('command/restore')]": 
  function restore(context) 
  {
    if (context.decmouse) {
      let {locator_reporting_mode} = context.decmouse;
      this._locator_repoting_mode = locator_repoting_mode;
    }
  },

  /** Fired at scroll session is started. */
  "[subscribe('event/scroll-session-started'), enabled]":
  function onScrollSessionStarted() 
  {
    this._in_scroll_session = true;
  },

  /** Fired at scroll session is closed. */
  "[subscribe('event/scroll-session-closed'), enabled]":
  function onScrolSessionClosed() 
  {
    this._in_scroll_session = false;
  },

  /** Fired at the mouse tracking mode is changed. */
  "[subscribe('event/mouse-tracking-mode-changed')]":
  function onMouseTrackingModeChanged(data) 
  {
    this._locator_reporting_mode = null;
  },

  /** Fired at the locator reporting mode is changed. */
  "[subscribe('command/change-locator-reporting-mode'), enabled]": 
  function onChangeLocatorReportingMode(mode) 
  {
    this._locator_reporting_mode = mode;
    if (mode) {
      this.onmousescroll.enabled = true;
    } else {
      this.onmousescroll.enabled = false;
    }
  },

  /** Fired at the locator reporting mode(button up) is changed. */
  "[subscribe('command/change-decterm-buttonup-event-mode'), enabled]": 
  function onChangeLocatorReportingButtonUpMode(mode) 
  {
    this._locator_buttonup_reporting = mode;
  },

  /** Fired at the locator reporting mode(button down) is changed. */
  "[subscribe('command/change-decterm-buttondown-event-mode'), enabled]": 
  function onChangeLocatorReportingButtonDownMode(mode) 
  {
    this._locator_buttondown_reporting = mode;
  },

  /** Fired at the mouse tracking type is changed. */
  "[subscribe('event/mouse-tracking-type-changed')]":
  function onMouseTrackingTypeChanged(data) 
  {
    this._locator_reporting_mode = null;
  },

  "[subscribe('event/locator-reporting-requested'), enabled]": 
  function reportDECTermStyleLocatorInfo()
  {
    let code;
    let event = this._locator_event;
    let locator_reporting_mode = this._locator_reporting_mode;
    if (null === locator_reporting_mode) {
      return;
    }

    if (null === event) {
      code = 0;
    } else {
      code = 1;
    }

    let column, row;
    if (locator_reporting_mode.pixel) {
      [column, row] = this._getCurrentPositionInPixel(event);
    } else {
      [column, row] = this._getCurrentPosition(event);
    }

    let message = coUtils.Text.format(
      "\x1b[%d;%d;%d;%d;1&w", 
      code, this._locator_state, row, column);

    let broker = this._broker;
    broker.notify("command/send-to-tty", message);

  },

  /** Mouse down evnet listener */
  "[listen('DOMMouseScroll', '#tanasinn_content')]": 
  function onmousescroll(event) 
  {
    let renderer = this.dependency["renderer"];
    if(event.axis === event.VERTICAL_AXIS) {

      let count = event.detail;
      if (event.hasPixels) {
        let line_height = renderer.line_height;
        count = Math.round(count / line_height + 0.5);
      } else {
        count = Math.round(count / 2);
      }
      if (0 == count) {
        return;
      }

      let broker = this._broker;
      let locator_reporting_mode = this._locator_reporting_mode;

      if (this._in_scroll_session 
          || null === locator_reporting_mode) {
        if (count > 0) {
          broker.notify("command/scroll-down-view", count);
          broker.notify("command/draw");
        } else if (count < 0) {
          broker.notify("command/scroll-up-view", -count);
          broker.notify("command/draw");
        } else { // count == 1
          return;
        }

      } else {

        let sequences = [];
        if (count > 0) {
          while (count--)
            sequences.push("\x1bOB")
        } else if (count < 0) {
          //sequences.push("\x1b[B")
          while (count++)
            sequences.push("\x1bOA")
        } else {
          return; 
        }
        let message = sequences.join("");
        broker.notify("command/send-to-tty", message);

      }
    }
  },

  /** Mouse down evnet listener */
  "[listen('mousedown', '#tanasinn_content')]": 
  function onmousedown(event) 
  {

    if (null === this._locator_reporting_mode) {
      return;
    }

    let locator_reporting_mode = this._locator_reporting_mode;
    if (null === locator_reporting_mode) {
      return;
    }


    switch (event.button) {

      case 0:
        code = 2;
        this._locator_state |= 4;
        break;

      case 1:
        code = 4;
        this._locator_state |= 2;
        break;

      case 2:
        code = 6;
        this._locator_state |= 1;
        break;

      case 3:
        code = 8;
        this._locator_state |= 8;
        break;

      default:
        throw coUtils.Debug.Error(
          _("Unhandled mousedown event, button: %d."), 
          event.button);

    }

    if (locator_reporting_mode.oneshot) {
      this._locator_reporting_mode = null;
    }
    let column, row 
    if (locator_reporting_mode.pixel) {
      [column, row] = this._getCurrentPositionInPixel(event);
    } else {
      [column, row] = this._getCurrentPosition(event);
    }
    let message = coUtils.Text.format(
      "\x1b[%d;%d;%d;%d;1&w", 
      code, this._locator_state, row, column);

    let broker = this._broker;
    broker.notify("command/send-to-tty", message);
  },

  /** Mouse move evnet listener */
  "[listen('mousemove', '#tanasinn_content')]": 
  function onmousemove(event) 
  {
    this._locator_event = event;
  },

  /** Mouse up evnet listener */
  "[listen('mouseup', '#tanasinn_content')]": 
  function onmouseup(event) 
  {
    if (null === this._locator_reporting_mode) {
      return;
    }

    switch (event.button) {

      case 0:
        code = 3;
        this._locator_state ^= 4;
        break;

      case 1:
        code = 5;
        this._locator_state ^= 2;
        break;

      case 2:
        code = 7;
        this._locator_state ^= 1;
        break;

      case 3:
        code = 9;
        this._locator_state ^= 8;
        break;

      default:
        throw coUtils.Debug.Error(
          _("Unhandled mouseup event, button: %d."), 
          event.button);
    }

    if (locator_reporting_mode.oneshot) {
      this._locator_reporting_mode = null;
    }
    let column, row 
    if (locator_reporting_mode.pixel) {
      [column, row] = this._getCurrentPositionInPixel(event);
    } else {
      [column, row] = this._getCurrentPosition(event);
    }
    let message = coUtils.Text.format(
      "\x1b[%d;%d;%d;%d;1&w", 
      code, this._locator_state, row, column);

    let broker = this._broker;
    broker.notify("command/send-to-tty", message);

  },
  
  // Helper: get current position from mouse event object.
  _getCurrentPosition: function _getCurrentPosition(event) 
  {
    let broker = this._broker;
    let target_element = broker.uniget(
      "command/query-selector", 
      "#tanasinn_center_area");
    let box = target_element.boxObject;
    let offsetX = box.screenX - broker.root_element.boxObject.screenX;
    let offsetY = box.screenY - broker.root_element.boxObject.screenY;
    let left = event.layerX - offsetX; // left position in pixel.
    let top = event.layerY - offsetY;  // top position in pixel.

    // converts pixel coordinate to [column, row] style.
    let renderer = this.dependency["renderer"];
    let column = Math.round(left / renderer.char_width);
    let row = Math.round(top / renderer.line_height);
    return [column, row];
  },

  // Helper: get current position from mouse event object in pixel.
  _getCurrentPositionInPixel: function _getCurrentPositionInPixel(event) 
  {
    let broker = this._broker;
    let target_element = broker.uniget(
      "command/query-selector", 
      "#tanasinn_center_area");
    let box = target_element.boxObject;
    let offsetX = box.screenX - broker.root_element.boxObject.screenX;
    let offsetY = box.screenY - broker.root_element.boxObject.screenY;
    let left = event.layerX - offsetX; // left position in pixel.
    let top = event.layerY - offsetY;  // top position in pixel.
    return [left, top];
  },

};

/**
 * @fn main
 * @brief Module entry point.
 * @param {Broker} broker The Broker object.
 */
function main(broker) 
{
  new WheelScroll(broker);
  new DECLocatorMouse(broker);
}
