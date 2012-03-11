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
 * @class CommandlineHistory
 *
 */
let CommandlineHistory = new Class().extends(Plugin);
CommandlineHistory.definition = {

  get id()
    "commandline_history",

  get info()
    <plugin>
        <name>{_("Commandline History")}</name>
        <version>0.1</version>
        <description>{
          _("Provides commandline history database.")
        }</description>
    </plugin>,

  "[persistable] enabled_when_startup": true,

  _history: null,
  _history_index: 0,
  "[persistable] history_file_path": "history/commandline.txt",

  /** Installs itself. 
   *  @param {Session} session A Session object.
   */
  "[subscribe('install/commandline_history'), enabled]":
  function install(session) 
  {
    this.clearHistory.enabled = true;
    this.nextHistory.enabled = true;
    this.previousHistory.enabled = true;
    this.onCommand.enabled = true;
    this.loadHistory();
  },

  /** Uninstalls itself. 
   *  @param {Session} session A Session object.
   */
  "[subscribe('uninstall/commandline_history'), enabled]":
  function uninstall(session) 
  {
    this.clearHistory.enabled = false;
    this.nextHistory.enabled = false;
    this.previousHistory.enabled = false;
    this.onCommand.enabled = false;

    this._converter.flush();
    this._converter.close();
    this._converter = null;
    this._file = null;
    coUtils.Debug.reportMessage(
      _("Resources in CommandlineHistory have been cleared."));
  },

  /**
   *
   */
  loadHistory: function loadHistory() 
  {
    // create nsIFile object.
    let broker = this._broker;
    let path = coUtils.File
      .getFileLeafFromVirtualPath(broker.runtime_path + "/" + this.history_file_path)
      .path;
    let file = Components
      .classes["@mozilla.org/file/local;1"]
      .createInstance(Components.interfaces.nsILocalFile);
    file.initWithPath(path);
    this._file = file;
    if (file.exists() && file.isReadable) {
      let content = coUtils.IO.readFromFile(path, "UTF-8");
      this._history = content.split(/[\r\n]+/)
        .reduce(function(prev, current) {
          prev[current] = true;
          return prev;
        }, {});
    } else {
      this._history = {};
    }

    // check if target log file exists.
    if (file.exists()) {
      // check if target is file node.
      if (!file.isFile) {
        throw coUtils.Debug.Exception(
          _("Specified file '%s' is not a file node."), path);
      }
      // check if target is writable.
      if (!file.isWritable) {
        throw coUtils.Debug.Exception(
          _("Specified file '%s' is not a writable file node."), path);
      }
    } else { // if target is not exists.
      // create base directories recursively (= mkdir -p).
      void function make_directory(current) 
      {
        let parent = current.parent;
        if (!parent.exists()) {
          make_directory(parent);
          parent.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, -1);
        }
      } (file);
    }
   
    // create output stream.
    let ostream = Components
      .classes["@mozilla.org/network/file-output-stream;1"]
      .createInstance(Components.interfaces.nsIFileOutputStream);  
      
    // write (0x02), appending (0x10), "rw"
    const PR_WRONLY = 0x02;
    const PR_CREATE_FILE = 0x08;
    const PR_APPEND = 0x10;
    const PR_TRUNCATE = 0x20;
    ostream.init(file, PR_WRONLY| PR_CREATE_FILE| PR_APPEND, -1, 0);   
    
    let converter = Components
      .classes["@mozilla.org/intl/converter-output-stream;1"].  
      createInstance(Components.interfaces.nsIConverterOutputStream);  
    converter.init(ostream, "UTF-8", 0, 0);  
    this._converter = converter;
  },

  closeHistory: function closeHistory()
  {
    // close history file.
    if (this._converter) {
      this._converter.close(); // closes the output stream.  
    }
  },

  "[command('clearhistory/chistory'), _('clear command line history.')]":
  function clearHistory()
  {
    this.closeHistory();

    // remove history file.
    let broker = this._broker;
    coUtils.File
      .getFileLeafFromVirtualPath(broker.runtime_path + "/" + this.history_file_path)
      .remove(false);

    this.loadHistory();

    return {
      success: true,
      message: _("History file was removed successfully."),
    };
  },

  "[subscribe('command/select-next-history')]":
  function nextHistory(info)
  {
    let history_list = Object.keys(this._history);
    let index = ++this._history_index % history_list.length
    if (index < 0) {
      index += history_list.length;
    }
    let value = history_list[index];
    info.textbox.value = value;
  },

  "[subscribe('command/select-previous-history')]":
  function previousHistory(info)
  {
    let history_list = Object.keys(this._history);
    let index = --this._history_index % history_list.length
    if (index < 0) {
      index += history_list.length;
    }
    let value = history_list[index];
    info.textbox.value = value;
  },

  "[subscribe('command/eval-commandline')]":
  function onCommand(command)
  {
    this._history[command] = true;
    this._history_index = 0;
    try {
      this._converter.writeString(command + "\n");
    } catch (e) {
      /* Ignore any errors to prevent recursive-call. */
    }
  },

}; // CommandlineHistory

/**
 * @fn main
 * @brief Module entry point.
 * @param {Broker} broker The Broker object.
 */
function main(broker)
{
  new CommandlineHistory(broker);
}


