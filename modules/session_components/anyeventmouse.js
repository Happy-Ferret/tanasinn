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
 * @class AnyEventMouseMode
 *
 * XT_MSE_ANY - any event mouse mode
 * 
 * Default: off
 *
 * Format
 *
 * CSI   ?     1     0     0     3     h
 * 9/11  3/15  3/1   3/0   3/0   3/3   6/8
 *
 * Set: enable any event mouse mode.
 *
 *
 * CSI   ?     1     0     0     3     l
 * 9/11  3/15  3/1   3/0   3/0   3/3   6/12
 *
 * Reset: disable any event mouse mode.
 *
 */
var AnyEventMouseMode = new Class().extends(Plugin);
AnyEventMouseMode.definition = {

  get id()
    "any_event_mouse_mode",

  get info()
    <module>
        <name>{_("Any Event Mouse Mode")}</name>
        <version>0.1</version>
        <description>{
          _("Switch any event mouse mode.")
        }</description>
    </module>,


  "[persistable] enabled_when_startup": true,
  "[persistable] default_value": false,

  _mode: false,

  /** installs itself. 
   *  @param {Broker} broker A Broker object.
   */
  "[install]":
  function install(broker) 
  {
    this._mode = this.default_value;
  },

  /** Uninstalls itself.
   *  @param {Broker} broker A broker object.
   */
  "[uninstall]":
  function uninstall(broker) 
  {
    this._mode = null;
  },

  /** Use All Motion Mouse Tracking.
   */
  "[subscribe('sequence/decset/1003'), pnp]":
  function activate() 
  { 
    this._mode = true;
 
    this.sendMessage(
      "event/mouse-tracking-mode-changed", 
      coUtils.Constant.TRACKING_ANY);
    coUtils.Debug.reportMessage(
      _("DECSET 1003 - xterm all motion mouse tracking mode was set."));
  },
 
  /** Don't Use All Motion Mouse Tracking.
   */
  "[subscribe('sequence/decrst/1003'), pnp]":
  function deactivate() 
  {
    this._mode = false;

    this.sendMessage(
      "event/mouse-tracking-mode-changed", 
      coUtils.Constant.TRACKING_NONE);
    coUtils.Debug.reportMessage(
      _("DECRST 1003 - xterm all motion mouse tracking mode was reset."));
  },

  /** Report mode
   */
  "[subscribe('sequence/decrqm/1003'), pnp]":
  function report() 
  {
    var mode = this._mode ? 1: 2,
        message = "?1003;" + mode + "$y";

    this.sendMessage("command/send-sequence/csi", message);
  },

  /** on hard / soft reset
   */
  "[subscribe('command/{soft | hard}-terminal-reset'), pnp]":
  function reset(broker) 
  {
    if (this.default_value) {
      this.activate();
    } else {
      this.deactivate();
    }
  },

  /**
   * Serialize snd persist current state.
   */
  "[subscribe('@command/backup'), type('Object -> Undefined'), pnp]": 
  function backup(context) 
  {
    // serialize this plugin object.
    context[this.id] = {
      mode: this._mode,
    };
  },

  /**
   * Deserialize snd restore stored state.
   */
  "[subscribe('@command/restore'), type('Object -> Undefined'), pnp]": 
  function restore(context) 
  {
    var data = context[this.id];

    if (data) {
      this._mode = data.mode;
    } else {
      coUtils.Debug.reportWarning(
        _("Cannot restore last state of renderer: data not found."));
    }
  },


}; // class AnyEventMouseMode

/**
 * @fn main
 * @brief Module entry point.
 * @param {Broker} broker The Broker object.
 */
function main(broker) 
{
  new AnyEventMouseMode(broker);
}

// EOF