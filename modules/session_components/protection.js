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
 * @class Protection
 *
 */
var Protection = new Class().extends(Plugin)
                            .depends("screen");
Protection.definition = {

  get id()
    "protection",

  get info()
    <module>
        <name>{_("Protection")}</name>
        <version>0.1</version>
        <description>{
          _("Add protected character attribute support.")
        }</description>
    </module>,

  "[persistable] enabled_when_startup": true,

  "[install]":
  function install()
  {
    this._screen = this.dependency["screen"];
    this._attr = this._screen.cursor.attr;
  },

  "[uninstall]":
  function uninstall()
  {
    this._screen = null;
    this._attr = null;
  },

  /**
   *
   * DECSCA — Select Character Protection Attribute
   *
   * DECSCA defines the characters that come after it as erasable or not 
   * erasable from the screen. The selective erase control functions (DECSED
   * and DECSEL) can only erase characters defined as erasable.
   *
   * Available in: VT Level 4 mode only
   *
   * Format
   *
   * CSI    Ps   "    q
   * 9/11   3/n  2/2  7/1
   *
   * Parameters
   *
   * Ps
   * defines all characters that follow the DECSCA function as erasable or not 
   * erasable.
   *
   * Ps   Meaning
   * 0    (default)  DECSED and DECSEL can erase characters.
   * 1    DECSED and DECSEL cannot erase characters.
   * 2    Same as 0.
   *
   * Note on DECSCA
   *
   * DECSCA does not effect visual character attributes set by the select 
   * graphic rendition (SGR) function.
   *
   */
  "[profile('vt100'), sequence('CSI %d\"q')]":
  function DECSCA(n) 
  { // Device Status Report

    var attr;

    attr = this._attr;;

    switch (n || 0) {

      // (default)  DECSED and DECSEL can erase characters.
      case 0:
        attr.protected = false;
        break;

      // DECSED and DECSEL cannot erase characters.
      case 1:
        attr.protected = true;
        break;

      // Same as 0.
      case 2:
        attr.protected = false;
        break;

      default:
        coUtils.Debug.reportWarning(
          _("%s sequence [%s] was ignored."),
          arguments.callee.name, Array.slice(arguments));
    }
  },

  /**
   *
   * DECSEL — Selective Erase in Line
   *
   * This control function erases some or all of the erasable characters in
   * a single line of text. DECSEL erases only those characters defined as 
   * erasable by the DECSCA control function. DECSEL works inside or outside 
   * the scrolling margins.
   *
   * Available in: VT Level 4 mode only
   *
   * Format
   *
   * CSI    ?      Ps   K
   * 9/11   3/15   3/n  4/11
   *
   * Parameters
   *
   * Ps
   * represents the section of the line to erase, as follows:
   *
   * Ps   Section Erased
   * 0    (default)  From the cursor through the end of the line
   * 1    From the beginning of the line through the cursor
   * 2    The complete line
   *
   */
  "[profile('vt100'), sequence('CSI ?%dK')]":
  function DECSEL(n) 
  { // Selective Erase Line
    var screen
     
    screen = this._screen;
   
    switch (n || 0) {

      case 0: // erase to right
        screen.selectiveEraseLineToRight();
        break;

      case 1: // erase to left
        screen.selectiveEraseLineToLeft();
        break;

      case 2: // erase all
        screen.selectiveEraseLine();
        break;

      default:
        coUtils.Debug.reportWarning(
          _("%s sequence [%s] was ignored."),
          arguments.callee.name, Array.slice(arguments));
    }
  },

  /**
   *
   * DECSED — Selective Erase in Display
   *
   * This control function erases some or all of the erasable characters in 
   * the display. DECSED can only erase characters defined as erasable by the 
   * DECSCA control function. DECSED works inside or outside the scrolling 
   * margins.
   *
   * Available in: VT Level 4 mode only
   *
   * Format
   *
   * CSI    ?      Ps   J
   * 9/11   3/15   3/n  4/10
   *
   * Parameters
   *
   * Ps
   * represents the area of the display to erase, as follows:
   *
   * Ps   Area Erased
   * 0    (default)  From the cursor through the end of the display
   * 1    From the beginning of the display through the cursor
   * 2    The complete display
   *
   */
  "[profile('vt100'), sequence('CSI ?%dJ')]":
  function DECSED(n) 
  { // Selective Erase Display
    var screen
     
    screen = this._screen;
   
    switch (n || 0) {

      case 0:   // erase below
        screen.selectiveEraseScreenBelow();
        break;

      case 1:   // erase above
        screen.selectiveEraseScreenAbove();
        break;

      case 2: // erase all
        screen.selectiveEraseScreenAll();
        break;
      
      default:
        coUtils.Debug.reportWarning(
          _("%s sequence [%s] was ignored."),
          arguments.callee.name, Array.slice(arguments));
    }

  },

  /**
   * DECSERA — Selective Erase Rectangular Area
   *
   * This control function erases all erasable characters from a specified 
   * rectangular area in page memory. The select character protection 
   * attribute (DECSCA) control function defines whether or not DECSERA can 
   * erase characters.
   *
   * When an area is erased, DECSERA replaces character positions with the 
   * space character (2/0). DECSERA does not change:
   *
   * - Visual attributes set by the select graphic rendition (SGR) function
   * - Protection attributes set by DECSCA
   * - Line attributes
   *
   * Available in: VT Level 4 mode only
   *
   * Format
   *
   * CSI    Pt   ;      Pl   ;      Pb   ;      Pr   $    {
   * 9/11   3/n  3/11   3/n  3/11   3/n  3/11   3/n  2/4  7/11
   *
   *
   * Parameters
   *
   * Pt, Pl, Pb, and Pr
   * define the rectangular area to be selectively erased:
   *
   * Pt is the top-line border. Pt must be less than or equal to Pb.
   * Default: Pt = 1.
   *
   * Pl is the left-column border. Pl must be less than or equal to Pr.
   * Default: Pl = 1.
   *
   * Pb is the bottom-line border.
   * Default: Pb = the last line of the active page.
   *
   * Pr is the right-column border.
   * Default: Pr = the last column of the active page.
   *
   *
   * Notes on DECSERA
   *
   * The coordinates of the rectangular area are affected by the setting of
   * origin mode (DECOM).
   * DECSERA is not affected by the page margins.
   * If the value of Pt, Pl, Pb, or Pr exceeds the width or height of the 
   * active page, then the value is treated as the width or height of that page.
   * DECSERA does not change the active cursor position.
   *
   */
  "[profile('vt100'), sequence('CSI %d${')]":
  function DECSERA(n1, n2, n3, n4) 
  { // Selective Erase Rectangle Area
    var screen, top, left, bottom, right;

    screen = this._screen;

    top = (n1 || 1) - 1;
    left = (n2 || 1) - 1;
    bottom = (n3 || 1) - 1;
    right = (n4 || 1) - 1;

    if (top >= bottom || left >= right) {
      throw coUtils.Debug.Exception(
        _("Invalid arguments detected in %s [%s]."),
        arguments.callee.name, Array.slice(arguments));
    }

    bottom = Math.min(bottom, screen.height);
    right = Math.min(right, screen.width);

    screen.selectiveEraseRectangle(top, left, bottom, right);
  },

}; // class Protection

/**
 * @fn main
 * @brief Module entry point.
 * @param {Broker} broker The Broker object.
 */
function main(broker) 
{
  new Protection(broker);
}

