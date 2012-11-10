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

"use strict";

/**
 *  @class ScreenshotCommand
 */
var ScreenshotCommand = new Class().extends(Plugin);
ScreenshotCommand.definition = {

  id: "screenshot",

  getInfo: function getInfo()
  {
    return {
      name: _("Screenshot Command"),
      description: _("Provides screenshot command."),
      version: "0.1",
    };
  },

  "[persistable] enabled_when_startup": true,

  /** Installs itself. 
   *  @param {InstallContext} context A InstallContext object.
   */
  "[install]":
  function install(context) 
  {
  },

  /** Uninstalls itself.
   */
  "[uninstall]":
  function uninstall() 
  {
  },

  "[command('screenshot'), _('Convert screen to a image file.'), pnp]":
  function screenshot(arguments_string) 
  {
    var pattern = /^(\S+)s*$/,
        match = arguments_string.match(pattern),
        path,
        file,
        name;

    if (null === match) {
      return {
        success: false,
        message: _("Ill-formed message."),
      };
    }
    [, name] = match;

    path = coUtils.Runtime.getRuntimePath() + "/screenshot/" + name + ".png";
    file = coUtils.File
      .getFileLeafFromVirtualPath(path)
      .QueryInterface(Components.interfaces.nsILocalFile);

    // create base directories recursively (= mkdir -p).
    void function make_directory(current) 
    {
      var parent;

      parent = current.parent;

      if (!parent.exists()) {
        make_directory(parent);
        parent.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, -1);
      }
    } (file);

    this.sendMessage("command/capture-screen", {
      file: file,
      thumbnail: false
    });
    return {
      success: true,
      message: _("Succeeded."),
    };
  },

} // class ScreenshotCommand

/**
 * @fn main
 * @brief Module entry point.
 * @param {Broker} broker The Broker object.
 */
function main(broker) 
{
  new ScreenshotCommand(broker);
}

// EOF
