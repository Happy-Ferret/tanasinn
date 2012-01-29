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
 *  @class PopupMenu
 */
let PopupMenu = new Class().extends(Plugin);
PopupMenu.definition = {

  get id()
    "popup_menu",

  get info()
    <module>
        <name>Popup Menu</name>
        <description>{
          _("Handles application plivate sequence and shows native popup menu.")
        }</description>
        <version>0.1</version>
    </module>,

  "[persistable] duration": 150,
  "[persistable] color": "white",
  "[persistable] opacity": 0.25,
  "[persistable] max_height": 450,

  _cover: null,
  _is_showing: false,
  
  /** post-constructor */
  "[subscribe('initialized/{renderer & cursorstate}'), enabled]":
  function onLoad(renderer, cursor_state) 
  {
    this._renderer = renderer;
    this._cursor_state = cursor_state;
    this.enabled = this.enabled_when_startup;
  },
 
  /** installs itself. 
   *  @param {Session} session A session object.
   */
  "[subscribe('install/pupup_menu')]":
  function install(session) 
  {
    this.onDisplay.enabled = true;
    this.onUndisplay.enabled = true;
    let {
      tanasinn_app_popup_datum,
      tanasinn_app_popup,
      tanasinn_app_popup_scrollbox,
      tanasinn_app_popup_container,
    } = session.uniget(
      "command/construct-chrome", 
      {
        parentNode: "#tanasinn_center_area",
        tagName: "box",
        id: "tanasinn_app_popup_datum",
        style: <>
          position: absolute;
        </>,
        childNodes: 
        {
          tagName: "panel",
          id: "tanasinn_app_popup",
          style: <>
            -moz-appearance: none;
            -moz-user-focus: none;
            background-color: transparent;
          </>,
          noautofocus: true,
          noautohide: true,
          ignorekeys: true,
          childNodes: {
            tagName: "stack",
            flex: 1,
            childNodes: [
              {
                tagName: "box",
                flex: 1,
                style: <>
                  opacity: 0.40;
                  background-image: -moz-linear-gradient(top, #aaa, #888); 
                  border-radius: 8px;
                </>,    
              },
              {
                tagName: "scrollbox",
                id: "tanasinn_app_popup_scrollbox",
                orient: "vertical",
                flex: 1,
                maxHeight: this.max_height,
                style: <>
                  margin: 9px;
                  overflow-y: auto;
                </>,
                childNodes: {
                  tagName: "grid",
                  id: "tanasinn_app_popup_container",
                },
              },
            ],
          },
        },
      });
    this._datum = tanasinn_app_popup_datum;
    this._popup = tanasinn_app_popup;
    this._scrollbox = tanasinn_app_popup_scrollbox;
    this._container = tanasinn_app_popup_container;
  },

  /** Uninstalls itself.
   *  @param {Session} session A session object.
   */
  "[subscribe('uninstall/popup_menu')]":
  function uninstall(session) 
  {
    this.onDisplay.enabled = false;
    this.onUndisplay.enabled = false;
    this._datum.parentNode.removeChild(this._datum);
  },

  "[subscribe('sequence/osc/201')]":
  function onUndisplay(data) 
  {
    this._is_showing = false;
    coUtils.Timer.setTimeout(function() {
      if (false === this._is_showing) {
        this._popup.hidePopup();
        let session = this._broker;
        session.notify("command/focus");
      }
    }, 30, this);
  },

  "[subscribe('sequence/osc/200')]":
  function onDisplay(data) 
  {
    while (this._container.firstChild) {
      this._container.removeChild(this._container.firstChild);
    }
    let lines = data.split("\n");
    let [row, column, selected] = lines.shift()
      .split(",")
      .map(function(str) Number(str));
    let cursor_state = this._cursor_state;
    row = row || cursor_state.positionY + 1;
    let renderer = this._renderer;
    let line_height = renderer.line_height;
    let char_width = renderer.char_width;
    let x = column * char_width - 10;
    let y = row * line_height;

    let colormap = [ "", "#cdffcf", "#cdd", "#dfffdd" ];
    let session = this._broker;
    let {} = session.uniget(
      "command/construct-chrome", 
      {
        parentNode: "#tanasinn_app_popup_container",
        tagName: "rows",
        style: <>
          -moz-user-focus: none;
          font-family: {renderer.font_family};
          font-size: {renderer.font_size}px;
          font-weight: bold;
          color: #ffefff;
          text-shadow: 1px 1px 3px black, 0px 0px 4px black;
        </>,
        childNodes: [
          {
            tagName: "row",
            style: <>
              padding: 0px 10px;
            </> + (index == selected && <>
              background-image: -moz-linear-gradient(top, #ddd, #eee); 
              -moz-box-shadow: 1px 1px 5px black;
              color: #ffefef;
              border-radius: 5px;
            </>),
            childNodes: [
              {
                tagName: "box",
                innerText: function() 
                { 
                  try { 
                    return coUtils.Text.base64decode(cell); 
                  } catch(e) { 
                    return cell;
                  }
                }(),
                style: <>
                  padding: 0px 5px;
                  color: {colormap[index]};
                </>,
              } for ([index, cell] in Iterator(line.split(",")))
            ]
          } for ([index, line] in Iterator(lines))
        ],
      });
    this._datum.style.height = renderer.line_height + "px";
    this._datum.style.top = y + "px";
    //if (/^(?:closed|hiding)$/.test(this._popup.state)) {
    //if (!this._is_showing) {
      this._is_showing = true;
      this._popup.openPopup(
        this._datum, 
        "after_start", x, 0, true, true);
    //}
    session.notify("command/focus");
    if (-1 != selected) {
      let scrollbox = this._scrollbox;
      let rows = scrollbox.querySelector("rows");
      let box_object = scrollbox.boxObject
        .QueryInterface(Components.interfaces.nsIScrollBoxObject)
      if (box_object) {
        let row = rows.childNodes[selected];
        let scrollY = {};
        box_object.getPosition({}, scrollY);
        let first_position = row.boxObject.y 
          - scrollbox.boxObject.y;
        let last_position = first_position 
          - scrollbox.boxObject.height 
          + row.boxObject.height;
        if (first_position < scrollY.value) {
          box_object.scrollTo(0, first_position);
        } else if (last_position > scrollY.value) {
          box_object.scrollTo(0, last_position);
        }
      }
      scrollbox.setAttribute("orient", "vertical");
    }
//    box_object.scrollTo(0, selected * rows.firstChild.boxObject.height);
  },

  _selectRow: function _selectRow(row)
  {
    row.style.borderRadius = "6px";
    row.style.backgroundImage 
      = "-moz-linear-gradient(top, #777, #666)";
    row.style.color = "white";
    let completion_root = this._completion_root;
    let scroll_box = completion_root.parentNode;
    let box_object = scroll_box.boxObject
      .QueryInterface(Components.interfaces.nsIScrollBoxObject)
    if (box_object) {
      let scrollY = {};
      box_object.getPosition({}, scrollY);
      let first_position = row.boxObject.y 
        - scroll_box.boxObject.y;
      let last_position = first_position 
        - scroll_box.boxObject.height 
        + row.boxObject.height;
      if (first_position < scrollY.value) {
        box_object.scrollTo(0, first_position);
      } else if (last_position > scrollY.value) {
        box_object.scrollTo(0, last_position);
      }
    }
  },

} // class Popup


/**
 * @fn main
 * @brief Module entry point.
 * @param {Desktop} desktop The Desktop object.
 */
function main(desktop) 
{
  desktop.subscribe(
    "@initialized/broker", 
    function(session) new PopupMenu(session));
}

