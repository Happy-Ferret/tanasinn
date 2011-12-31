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
 * The Original Code is coTerminal
 *
 * The Initial Developer of the Original Code is
 * Hayaki Saito.
 * Portions created by the Initial Developer are Copyright (C) 2010 - 2011
 * the Initial Developer. All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

/*
 * @class DisplayManager
 * @brief Manages sisplay state for messages.
 */
let DisplayManager = new Class().extends(Component);
DisplayManager.definition = {

  get id()
    "displaymanager",

  /** @Property {Boolean} whether auto scroll feature is enabled.  */
  "[persistable] auto_scroll": true,

  _ui: null,
  _output_element: null,
  _filters: null,

  /** post-constructor */
  "[subscribe('@initialized/console'), enabled]":
  function onLoad(console) 
  {
    let session = this._broker;
    let id = "#console-output-box";
    [this._output_element] = session.notify("command/query-selector", id);
    session.subscribe("command/clear-messages", function() this.clear(), this);
    this._filters = session.notify("get/message-filters", this._filters);
    session.notify("initialized/displaymanager", this);
  },

  /** Appends a message line to output container. 
   *  @param {String} message raw message text from console service.
   */
  append: function append(message) 
  {
    let output_element = this._output_element;
    if (output_element) {
      let session = this._broker;

      let template = this.applyFilters(message);
      template.parentNode = output_element;
      session.uniget("command/construct-chrome", template);

      // makes scrollbar follow page's height.
      if (this.auto_scroll) {
        this.scrollToBottom();
      }
    }
  },
  
  /** Clears all message lines from output container. 
   */
  clear: function clear() 
  {
    let output_element = this._output_element;
    while (output_element.firstChild) { // MUST NOT allow infinity loop.
      output_element.removeChild(output_element.firstChild);
    }
  },

  /** apply filters and convert a message to ui template.
   * @param {String} message raw message string from console service.
   */
  applyFilters: function applyFilters(message) 
  {
    for (let [, filter] in Iterator(this._filters)) {
      if (filter.test(message)) {
        return filter.action();
      }
    };
    // returns fallback template.
    return {
      tagName: "vbox",
      style: { borderBottom: "1px solid green" },
      childNodes: { tagName: "vbox", innerText: message }
    };
  },
  
  /** tracks growing scroll region. */
  scrollToBottom: function scrollToBottom() 
  {
    let output_element = this._output_element;
    let frameElement = output_element//.parentNode;
    if (frameElement && frameElement.scrollHeight && frameElement.boxObject) {
      let currentScrollPosition 
        = frameElement.scrollTop + frameElement.boxObject.height;
      if (currentScrollPosition + 50 > frameElement.scrollHeight) {
        coUtils.Timer.setTimeout(function() {
          frameElement.scrollTop = frameElement.scrollHeight;
        }, 10);
      }
    }
  }
};

/** 
 * @class ConsoleListener
 * Listen console messages and pass them to display manager.
 */ 
let ConsoleListener = new Class().extends(Component);
ConsoleListener.definition = {

  get id()
    "consolelistener",

  _console_service: null,
  _display_manager: null,

  /** post-constructor */
  "[subscribe('initialized/displaymanager'), enabled]":
  function onLoad(display_manager) 
  {
    this._console_service = Components
      .classes["@mozilla.org/consoleservice;1"]
      .getService(Components.interfaces.nsIConsoleService);
    this._display_manager = display_manager;

    // set unregistration listener.
    this.onQuitApplication.enabled = true;
    this.onSessionStopping.enabled = true;
    
    // register object which implements nsIConsoleListener.
    this.register();

    // get histrical console messages and show them.
    this._trackHistricalMessages(this);

    let session = this._broker;
    session.notify("initialized/consolelistener", this);
  },

  "[subscribe('@event/quit-application')]": 
  function onQuitApplication() 
  {
    coUtils.Timer.setTimeout(this.unregister, 10, this);
  },
  
  "[subscribe('@event/session-stopping')]": 
  function onSessionStopping() 
  {
    coUtils.Timer.setTimeout(this.unregister, 10, this);
  },

// nsIConsoleListener
  /**
   * @param {nsIConsoleMessage} console_message nsIConsoleMessage beging posted.
   */
  observe: function(console_message)
  {
    try {
      let message = console_message.message;
      if (/coterminal/i.test(message)) {
        this._display_manager.append(message);
      }
    } catch (e) {
      try {
        this.unregister(this);
        coUtils.Debug.reportError(e);
      } catch (e) {
        // Nothing to do.
        // To guard against stack overflow, 
        // we MUST not emit any console output.
      }
    }
  },

  /** Register isself to console service */
  "[subscribe('command/register-console-listener'), enabled]":
  function register()
  {
    // register listener.
    this._console_service.registerListener(this);
  },

  /** Unregister isself from console service */
  "[subscribe('command/unregister-console-listener'), enabled]":
  function unregister() 
  {
    coUtils.Debug.reportMessage(
      _("Unregister listener from console service."));
    this._console_service.unregisterListener(this);
    coUtils.Debug.reportMessage(
      _("Succeeded to unregister console listener."));
    this.onSessionStopping.enabled = false;
    this.onQuitApplication.enabled = false;
  },

  /** Get recent console messages from buffer of console services. */
  _getMessageArray: function _getMessageArray()
  {
    // get latest 250 messages.
    let message_array = {};
    this._console_service.getMessageArray(message_array, {});
    return message_array;
  },

  _trackHistricalMessages: function _trackHistricalMessages()
  {
    // in case messages are not found, consoleService returns null.
    let message_array = this._getMessageArray();
    if (null !== message_array) {
      //for (let [index, message] in Iterator(message_array.value.reverse())) {
      //  if (/coterminal_initialize/.test(message.message)) {
          message_array.value
      //      .slice(0, index + 1)
      //      .reverse()
            .forEach(function(message) this.observe(message), this);
      //    break;
      //  }
      //}
    }
  },
};

/**
 * @class Console
 * @brief Shows formmated console messages.
 */
let Console = new Class().extends(Plugin);
Console.definition = {

  get id()
    "console",

  get info()
    <plugin>
        <name>{_("Console")}</name>
        <description>{
          _("Connects the console service and display formatted messages.")
        }</description>
        <version>0.1</version>
    </plugin>,

  get template()
    let (session = this._broker) 
    let (bottom_panel = this._bottom_panel)
    let (tab_panel = bottom_panel.alloc("console.panel", _("Console")))
    { 
       parentNode: tab_panel,
       tagName: "vbox",
       id: "coterminal_console_panel",
       className: "coterminal-console",
       flex: 1,
       style: { 
         margin: "0px",
       },
       childNodes: [
         {  // output box
           tagName: "vbox",
           id: "console-output-box",
           className: "error",
           flex: 1,
           style: {
             MozAppearance: "tabpanels",
             overflowY: "auto",
             fontSize: "12px",
             fontWeight: "bold",
           },
         },
         {
           tagName: "vbox",
           align: "center",
           valign: "top",
           childNodes: {
             tagName: "hbox",
             style: {
               overflow: "hidden", 
               margin: "0px", 
               MozBoxPack: "center",
             },
             childNodes: [
               {
                 tagName: "hbox",
                 id: "viewGroup",
                 style: { MozBoxPack: "center", },
                 childNodes: [
                   {
                     tagName: "toolbarbutton",
                     type: "radio",
                     label: mode.label,
                     value: mode.value,
                     group: "mode",
                     listener: {
                       type: "command",
                       handler: function(event) { 
                         let id = "#console-output-box";
                         let output_box = tab_panel.querySelector(id);
                         output_box.className = this.value;
                       },
                     },
                     onconstruct: function() {
                       if ("error" == this.value) {
                         coUtils.Timer.setTimeout(
                           function() this.checked = true, 
                           10, this);
                       }
                     },
                   } for each (mode in [
                     { label: _("All"),     value: "error warning message native" },
                     { label: _("Error"),   value: "error" },
                     { label: _("Warning"), value: "warning" },
                     { label: _("Message"), value: "message" },
                     { label: _("native"),  value: "native" },
                   ])
                 ]
               },
               { tagName: "toolbarseparator", },
               {
                 tagName: "toolbarbutton",
                 label: _("Clear"),
                 id: "Console:clear",
                 listener: {
                   type: "command",
                   context: this,
                   handler: function() session.notify("command/clear-messages"),
                 }
               }
             ]
           }
         },
       ]
     },

  /** constructor */
  "[subscribe('@initialized/{chrome & bottompanel}'), enabled]":
  function onLoad(chrome, bottom_panel) 
  {
    this._bottom_panel = bottom_panel;
    this.enabled = this.enabled_when_startup;
  },

  /** Installs itself */
  install: function install(session) 
  {
    let {coterminal_console_panel}
      = session.uniget("command/construct-chrome", this.template);
    this._console_box = coterminal_console_panel;
    this.select.enabled = true;
    session.notify("initialized/console", this);
  }, 

  /** Uninstalls itself. */
  uninstall: function uninstall(session) 
  {
    this.select.enabled = false;
    this._bottom_panel.remove("console.panel");
  },

  "[key('meta a'), _('Open console.')]":
  function select(info) 
  {
    this._bottom_panel.select("console.panel");
  },

};


/**
 * @fn main
 * @brief Module entry point.
 * @param {Process} process The Process object.
 */
function main(process) 
{
  process.subscribe(
    "initialized/session", 
    function(session)
    {
      new Console(session);
      new DisplayManager(session);
      new ConsoleListener(session);
    });
}

