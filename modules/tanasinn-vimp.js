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
 * The Initial Developer of the Original Code is * Hayaki Saito.
 * Portions created by the Initial Developer are Copyright (C) 2010 - 2011
 * the Initial Developer. All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

// PLUGIN_INFO//{{{
var PLUGIN_INFO =
<VimperatorPlugin>
    <name>{NAME}</name>
    <description>
      Provides some commands for driving tanasinn.
    </description>
    <detail><![CDATA[

let g:tanasinneditorcommand:
    e.g.)
      let g:tanasinneditorcommand="vim '%'"
    Set the external text editor command running on tanasinn window. 
    The editor must be console editor.
    If this variable is empty or undefined, default procedure 
    will be called when <C-i> is pressed in Insert and TextArea.

let g:tanasinnviewsourcecommand:
    e.g.)
      let g:tanasinnviewsourcecommand="vim +e '%'"

     ]]></detail>
</VimperatorPlugin>;
//}}}

try {

  void function() {
  
    var liberator, commands, completion, mappings, modes, editor, process;

    liberator = window.liberator;
    commands = liberator.modules.commands;
    completion = liberator.modules.completion;
    mappings = liberator.modules.mappings;
    modes = liberator.modules.modes;
    editor = liberator.modules.editor;
    
    /**
     * @fn getTanasinnProcess
     */
    function getTanasinnProcess() 
    {
      var contractID, process_class, current_file, file, process;

      contractID = "@zuse.jp/tanasinn/process;1";
      process_class = Components
        .classes[contractID]
      if (!process_class) {
        current_file = Components.stack
          .filename
          .split(" -> ").pop()
          .split("?").shift();
        file = current_file + "/../../tanasinn/modules/common/process.js?" + new Date().getTime();
        Components
          .classes["@mozilla.org/moz/jssubscript-loader;1"]
          .getService(Components.interfaces.mozIJSSubScriptLoader)
          .loadSubScript(file);
        process_class = Components.classes[contractID]
      }
      process = process_class
        .getService(Components.interfaces.nsISupports)
        .wrappedJSObject;
      return process;
    }
    process = getTanasinnProcess();
    
    function getDesktop() 
    {
      var desktops, desktop;

      desktops = process.notify("get/desktop-from-window", window);
      if (desktops) {
        desktop = desktops.filter(function(desktop) desktop)[0];
        if (desktop) {
          return desktop;
        }
      }
      desktop = process.uniget("event/new-window-detected", window);
      return desktop;
    }
    getDesktop();
    
    /**
     * @command tanasinnlaunch 
     */
    commands.addUserCommand(["tanasinnlaunch", "tla[unch]"], 
      "Show tanasinn's Launcher.", 
      function (args) 
      { 
        getDesktop().notify("command/show-launcher");
      }
    );
    
    /**
     * @command tanasinncommand 
     */
    commands.addUserCommand(["tanasinnstart", "tstart"], 
      "Run a operating system command on tanasinn.", 
      function (args) 
      { 
        getDesktop().notify("command/start-session", args.string);
      },
      { 
        argCount: "?",
        completer: function (context) completion.shellCommand(context),
        bang: true,
        literal: 0,
      } 
    );
    
    /**
     * @command tanasinnsend 
     */
    commands.addUserCommand(["tanasinncommand", "tcommand"], 
      "Run a tanasinn command on active tanasinn sessions.", 
      function (args) 
      { 
        getDesktop().notify("command/send-command", args.string);
      },
      { 
        argCount: "?",
        bang: true,
        literal: 0,
      } 
    );
    
    /**
     * @command tanasinnsendkeys
     */
    commands.addUserCommand(["tanasinnsendkeys", "tsend"], 
      "Send keys to tanasinn.", 
      function (args) 
      { 
        getDesktop().notify("command/send-keys", args.string);
      },
      { 
        argCount: "?",
        bang: true,
        literal: 0,
      } 
    );
    
    /**
     * Hooks "<C-i>" and "gF" key mappings and runs "g:tanasinneditorcommand" 
     * or "g:tanasinnviewsourcecommand", instead of default "editor" option.
     */
    var default_func = editor.editFileExternally;

    editor.editFileExternally = function (path) 
    {
      var editor_command, viewsource_command, desktop, complete, command, thread;

      editor_command = liberator.globalVariables.tanasinneditorcommand;
      viewsource_command = liberator.globalVariables.tanasinnviewsourcecommand;
      desktop = getDesktop();
      if (/^[a-z]+:\/\//.test(path)) { // when path is url spec. (path is expected to be escaped.)
        if (!viewsource_command) {
          default_func.apply(liberator.modules.editor, arguments);
        } else {
          desktop.notify(
            "command/start-session", 
            viewsource_command.replace(/%/g, path));
        };
      } else { // when path is native one.
        if (!editor_command) {
          default_func.apply(liberator.modules.editor, arguments);
        } else {
          complete = false;
          desktop.subscribe("@initialized/session", function(session) {
            session.subscribe("@event/broker-stopping", function(session) {
              complete = true;
            }, this);
          }, this);
          command = editor_command.replace(/%/g, path);
          desktop.notify("command/start-session", command);
          thread = Components.classes["@mozilla.org/thread-manager;1"]
            .getService(Components.interfaces.nsIThreadManager)
            .currentThread;
          while (!complete) {
            thread.processNextEvent(true);
          }
        };
      }
    };
  
  } ();

} catch (e) {
  var message;

  message = "Error at " + e.fileName + ":" + e.lineNumber + " " + String(e);
  liberator.log(message);
  liberator.echoerr(message);
}

