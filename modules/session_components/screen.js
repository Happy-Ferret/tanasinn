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
 * Portions created by the Initial Developer are Copyright (C) 2010 - 2013
 * the Initial Developer. All Rights Reserved.
 *
 * ***** END LICENSE BLOCK ***** */

"use strict";

/** sleep current_thread */
function wait(span)
{
  var end_time = Date.now() + span,
      current_thread = coUtils.Services.getThreadManager().currentThread;

  do {
    current_thread.processNextEvent(true);
  } while ((current_thread.hasPendingEvents()) || Date.now() < end_time);
}


//////////////////////////////////////////////////////////////////////////////
//
// Concepts
//

/**
 * @concept GrammarConcept
 */
var ScreenConcept = new Concept();
ScreenConcept.definition = {

  id: "ScreenConcept",

  // signature concept
  "allocate :: Uint16 -> Uint16 -> Array":
  _("Allocates n cells at once."),

}; // ScreenConcept

/**
 * @concept ScreenSwitchConcept
 */
var ScreenSwitchConcept = new Concept();
ScreenSwitchConcept.definition = {

  id: "ScreenSwitch",

  "switchToAlternateScreen :: Undefined":
  _("Switch to Alternate screen."),

  "switchToMainScreen :: Undefined":
  _("Switch to Main screen."),

  "selectAlternateScreen :: Undefined":
  _("Memorize cursor state, switch to Main screen, and erase screen."),

  "selectMainScreen :: Undefined":
  _("Erase screen, switch to Main screen, and restore cursor."),

}; // ScreenSwitchConcept

/**
* @concept ScreenBackupConcept
*/
var ScreenBackupConcept = new Concept();
ScreenBackupConcept.definition = {

  id: "ScreenBackup",

  "<command/backup> :: Object -> Undefined":
  _("Backups screen into serialize context."),

  "<command/restore-fast> :: Object -> Undefined":
  _("Restores screen from serialize context."),

}; // ScreenBackupConcept

/**
 * @concept ScreenCursorOperationsConcept
 *
 */
var ScreenCursorOperationsConcept = new Concept();
ScreenCursorOperationsConcept.definition = {

  id: "ScreenCursorOperations",

  "cursorForward :: Uint16 -> Undefined":
  _("Move cursor to forward (right)."),

  "cursorBackward :: Uint16 -> Undefined":
  _("Move cursor to backward (left)."),

  "cursorUp :: Uint16 -> Undefined":
  _("Move CUrsor Up (CUP)."),

  "cursorDown :: Uint16 -> Undefined":
  _("Move CUrsor Down (CUD)."),

  "setPositionX :: Uint16 -> Undefined":
  _("cursor CHaracter Absolute column (CHA)."),

  "setPositionY :: Uint16 -> Undefined":
  _("set Virtical Position Absolutely (VPA)."),

  "backSpace :: Undefined":
  _("BackSpace (BS)."),

  "carriageReturn :: Undefined":
  _("CarriageReturn (CR)."),

}; // ScreenCursorOperations

/**
 * @concept ScreenEditConcept
 *
 */
var ScreenEditConcept = new Concept();
ScreenEditConcept.definition = {

  id: "ScreenEdit",

  "eraseLineToRight :: Undefined":
  _("Erase cells from current position to end of line."),

  "eraseLineToLeft :: Undefined":
  _("Erase cells from specified position to head of line."),

  "eraseLine :: Undefined":
  _("Erase current line"),

  "eraseScreenAbove :: Undefined":
  _("Erase cells from current position to head of buffer."),

  "eraseScreenBelow :: Undefined":
  _("Erase cells from current position to end of buffer."),

  "eraseScreenAll :: Undefined":
  _("Erase every cells in screen."),

  "eraseScrollback :: Undefined":
  _("Erase scroll back memory."),

  "insertBlanks :: Uint16 -> Undefined":
  _("Insert n cells at specified position."),

  "setScrollRegion :: Uint16 -> Uint16 -> Undefined":
  _("Sets top margin and bottom margin of scroll region."),

  "resetScrollRegion :: Undefined":
  _("Resets top margin and bottom margin of scroll region."),

  "reverseIndex :: Undefined":
  _("Reverse Index (RI)."),

  "lineFeed :: Undefined":
  _("Line Feed (LF)"),

  "insertLine :: Uint16 -> Undefined":
  _("Inserts new lines at the specified position."),

  "deleteLine :: Uint16 -> Undefined":
  _("Deletes n lines from the specified position."),

  "scrollDownLine :: Uint16 -> Undefined":
  _("Scrolls up n lines."),

  "scrollUpLine :: Uint16 -> Undefined":
  _("Scrolls down n lines."),

  "eraseCharacters :: Uint16 -> Undefined":
  _("Erases n characters."),

  "deleteCharacters :: Uint16 -> Undefined":
  _("Deletes n characters."),

}; // ScreenEditConcept



//////////////////////////////////////////////////////////////////////////////
//
// Implementation
//

/**
 * @trait ScreenSequenceHandler
 *
 */
var ScreenSequenceHandler = new Trait("ScreenSequenceHandler");
ScreenSequenceHandler.definition = {

  /**
   * ICH — Insert Character
   *
   * This control function inserts one or more space (SP) characters starting
   * at the cursor position.
   *
   * Available in: VT Level 4 mode only
   *
   * Format
   *
   * CSI    Pn    @
   * 9/11   3/n   4/0
   *
   * Parameters
   *
   * @param {Number} n the number of characters to insert.
   *
   * Default: Pn = 1.
   * Description
   *
   * The ICH sequence inserts Pn blank characters with the normal character
   * attribute. The cursor remains at the beginning of the blank characters.
   * Text between the cursor and right margin moves to the right. Characters
   * scrolled past the right margin are lost. ICH has no effect outside the
   * scrolling margins.
   *
   */
  "[profile('vt100'), sequence('CSI Pn @')]":
  function ICH(n)
  { // Insert (blank) CHaracters.
    this.insertBlanks(n || 1)
  },

  /**
   * CUU — Cursor Up
   *
   * Moves the cursor up a specified number of lines in the same column.
   * The cursor stops at the top margin. If the cursor is already above the
   * top margin, then the cursor stops at the top line.
   *
   * Format
   *
   * CSI    Pn    A
   * 9/11   3/n   4/1
   *
   * Parameters
   *
   * @param {Number} n the number of lines to move the cursor up.
   *
   */
  "[profile('vt100'), sequence('CSI Pn A')]":
  function CUU(n)
  { // CUrsor Up
    this.cursorUp(n || 1);
  },

  /**
   * CUD — Cursor Down
   *
   * This control function moves the cursor down a specified number of lines
   * in the same column. The cursor stops at the bottom margin. If the cursor
   * is already below the bottom margin, then the cursor stops at the bottom
   * line.
   *
   * Format
   *
   * CSI    Pn    B
   * 9/11   3/n   4/2
   *
   * @param {Number} n the number of lines to move the cursor down.
   */
  "[profile('vt100'), sequence('CSI Pn B')]":
  function CUD(n)
  { // CUrsor Down
    this.cursorDown(n || 1);
  },

  /**
   * CUF — Cursor Forward
   *
   * This control function moves the cursor to the right by a specified
   * number of columns. The cursor stops at the right border of the page.
   *
   * Format
   *
   * CSI    Pn    C
   * 9/11   3/n   4/3
   *
   * @param {Number} n the number of columns to move the cursor to the right.
   */
  "[profile('vt100'), sequence('CSI Pn C')]":
  function CUF(n)
  { // CUrsor Forward (right).
    var right_margin;

    if (this._left_right_margin) {
      right_margin = this._scroll_right;
    } else {
      right_margin = this._width;
    }

    this.cursorForward(n || 1, right_margin);
  },

  /**
   * CUB — Cursor Backward
   *
   * This control function moves the cursor to the left by a specified number
   * of columns. The cursor stops at the left border of the page.
   *
   * Format
   *
   * CSI    Pn    D
   * 9/11   3/n   4/4
   *
   * @param {Number} n the number of columns to move the cursor to the left.
   */
  "[profile('vt100'), sequence('CSI Pn D')]":
  function CUB(n)
  { // CUrsor Back (left).
    var left_margin;

    if (this._left_right_margin) {
      left_margin = this._scroll_left;
    } else {
      left_margin = 0;
    }

    this.cursorBackward(n || 1, left_margin);
  },

  /**
   * CHA - Cursor Horizontal Absolute
   *
   * Move the active position to the n-th character of the active line.
   *
   * Default: 1.
   *
   * Format
   *
   * CSI    Pn    G
   * 9/11   3/n   4/7
   *
   * @param {Number} n the number of active positions to the n-th character
   *                   of the active line.
   *
   * Description
   *
   * The active position is moved to the n-th character position of the
   * active line.
   */
  "[profile('vt100'), sequence('CSI Pn G')]":
  function CHA(n)
  { // cursor CHaracter Absolute column
    var right_margin,
        cursor = this._cursor;

    n = (n || 1) - 1;

    if (this._left_right_margin_mode) {
      right_margin = this._scroll_right;
      if (cursor.DECOM) {
        n += this._scroll_left;
      }
    } else {
      right_margin = this._width;
    }

    if (n > right_margin) {
      cursor.positionX = right_margin;
    } else {
      cursor.positionX = n;
    }

  },

  /**
   * CUP - Cursor Position
   *
   * This control function moves the cursor to the specified line and column.
   * The starting point for lines and columns depends on the setting of
   * origin mode (DECOM). CUP applies only to the current page.
   *
   * Format
   *
   * CSI    Pl    ;      Pc    H
   * 9/11   3/n   3/11   3/n   4/8
   *
   * Parameters
   *
   * @param {Number} n1 the number of the line to move to. If n1 is 0 or 1,
   *                    then the cursor moves to line 1.
   *
   * @param {Number} n2 the number of the column to move to. If n1 is 0 or 1,
   *                    then the cursor moves to column 1.
   */
  "[profile('vt100'), sequence('CSI Pl;Pc H')]":
  function CUP(n1, n2)
  { // move CUrsor to absolute Position
    var left,
        top,
        right,
        bottom,
        cursor = this._cursor,
        y = (n1 || 1) - 1,
        x = (n2 || 1) - 1;

    if (this._left_right_margin_mode) {
      left = this._scroll_left;
      right = this._scroll_right;
    } else {
      left = 0;
      right = this._width;
    }

    top = this._scroll_top;
    bottom = this._scroll_bottom;

    if (cursor.DECOM) {
      x += left;
      y += top;
    }

    // set horizontal position
    if (x >= right) {
      cursor.positionX = right - 1;
    } else {
      cursor.positionX = x;
    }

    // set vertical position
    if (y >= bottom) {
      cursor.positionY = bottom - 1;
    } else {
      cursor.positionY = y;
    }
  },

  /**
   *
   * DECFI - Forward Index
   *
   * This control function moves the cursor forward one column.
   * If the cursor is at the right margin, then all screen data within the
   * margins moves one column to the left. The column shifted past the left
   * margin is lost.
   *
   * Available in: VT Level 4 mode only
   *
   *
   * Format
   *
   * ESC    9
   * 1/11   3/9
   *
   *
   * Description
   *
   * DECFI adds a new column at the right margin, with no visual attributes.
   * DECFI is not affected by the margins. If the cursor is at the right
   * border of the page when the terminal receives DECFI, then the terminal
   * ignores DECFI.
   *
   */
  "[profile('vt100'), sequence('ESC 9')]":
  function DECFI()
  { // DEC Forward Index
    var cursor = this._cursor,
        rightmargin = this._scroll_right;

    if (cursor.positionX >= rightmargin - 1) {
      cursor.positionX = rightmargin;
      this.scrollLeft(1);
    } else {
      ++cursor.positionX;
    }
  },

  /**
   *
   * DECBI - Back Index
   *
   * This control function moves the cursor backward one column.
   * If the cursor is at the left margin, then all screen data within the
   * margin moves one column to the right. The column that shifted past the
   * right margin is lost.
   *
   * Available in: VT Level 4 mode only
   *
   *
   * Format
   *
   * ESC    6
   * 1/11   3/6
   *
   *
   * Description
   *
   * DECBI adds a new column at the left margin with no visual attributes.
   * DECBI is not affected by the margins. If the cursor is at the left
   * border of the page when the terminal receives DECBI, then the terminal
   * ignores DECBI.
   *
   */
  "[profile('vt100'), sequence('ESC 6')]":
  function DECBI()
  { // DEC Backward Index
    var cursor = this._cursor,
        leftmargin = this._scroll_left;

    if (cursor.positionX <= leftmargin) {
      cursor.positionX = leftmargin;
      this.scrollRight(1);
    } else {
      --cursor.positionX;
    }
  },

  /**
   *
   * DECALN — Screen Alignment Pattern
   *
   * This control function fills the complete screen area with a test pattern
   * used for adjusting screen alignment. Normally, only manufacturing and
   * service personnel would use DECALN.
   *
   * Format
   *
   * ESC    #    8
   * 1/11   2/3  3/8
   *
   * Notes on DECALN
   *
   * DECALN sets the margins to the extremes of the page, and moves the cursor
   * to the home position.
   *
   * Also see the screen alignment in Chapter 2.
   *
   */
  "[profile('vt100'), sequence('ESC # 8')]":
  function DECALN()
  { // DEC Screen Alignment Test
    this.eraseScreenAllWithTestPattern();
  },

  /**
   * ED — Erase in Display
   *
   * This control function erases characters from part or all of the display.
   * When you erase complete lines, they become single-height, single-width
   * lines, with all visual character attributes cleared. ED works inside or
   * outside the scrolling margins.
   *
   * Format
   *
   * CSI    Ps    J
   * 9/11   3/n   4/10
   *
   * Parameters
   *
   * Ps   represents the amount of the display to erase.
   *
   * Ps   Area Erased
   *      0 (default)   From the cursor through the end of the display
   *      1             From the beginning of the display through the cursor
   *      2             The complete display
   *
   * Programming Tip
   * Use a Ps value of 2 to erase the complete display in a fast,
   * efficient manner.
   */
  "[profile('vt100'), sequence('CSI Ps J')]":
  function ED(n)
  { // Erase Display

    switch (n || 0) {

      case 0:   // erase below
        this.eraseScreenBelow();
        break;

      case 1:   // erase above
        this.eraseScreenAbove();
        break;

      case 2: // erase all
        this.eraseScreenAll();
        break;

      case 3: // erase saved lines (xterm)
        this.eraseScrollback();
        break;

      default:
        coUtils.Debug.reportWarning(
          _("%s sequence [%s] was ignored."),
          "ED", Array.slice(arguments));
    }

  },

  /**
   * DECERA - Erase Rectangular Area
   *
   * This control function erases characters from the specified rectangular
   * area in page memory. When an area is erased, DECERA replaces all
   * character positions with the space character (2/0). DECERA erases
   * character values and visual attributes from the specified area.
   * DECERA does not erase line attributes.
   *
   * Available in: VT Level 4 mode only
   *
   * Format
   *
   * CSI   Pt    ;     Pl    ;     Pb    ;     Pr    $     z
   * 9/11  3/n   3/11  3/n   3/11  3/n   3/11  3/n   2/4   7/10
   *
   * Parameters
   *
   * Pt, Pl, Pb, and Pr
   * define the rectangular area to be erased:
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
   *
   * Default: Pr = the last column of the active page.
   *
   * Notes on DECERA
   *
   *     The coordinates of the rectangular area are affected by the setting
   *     of origin mode (DECOM).
   *     DECERA is not affected by the page margins.
   *     If the value of Pt, Pl, Pb, or Pr exceeds the width or height of the
   *     active page, then the value is treated as the width or height of that
   *     page.
   *     DECERA does not change the active cursor position.
   */
  "[profile('vt100'), sequence('CSI Pt;Pl;Pb;Pr $ z')]":
  function DECERA(n1, n2, n3, n4)
  { // Erase Rectangle Area
    var top = (n1 || 1) - 1,
        left = (n2 || 1) - 1,
        bottom = (n3 || 1) - 1,
        right = (n4 || 1) - 1,
        scroll_left = this._scroll_left,
        scroll_top = this._scroll_top,
        scroll_right = this._scroll_right,
        scroll_bottom = this._scroll_bottom,
        width = this._width,
        height = this._height,
        cursor = this._cursor;

    if (cursor.DECOM) {
      left += scroll_left;
      top += scroll_top;
      right += scroll_left;
      bottom += scroll_top;
      if (top >= scroll_bottom) {
        top = scroll_bottom - 1;
      }
      if (bottom >= scroll_bottom) {
        bottom = scroll_bottom - 1;
      }
    }


    if (top >= bottom || left >= right) {
      throw coUtils.Debug.Exception(
        _("Invalid arguments detected in %s [%s]."),
        "DECERA", Array.slice(arguments));
    }

    if (bottom > height) {
      bottom = height;
    }
    if (right > width) {
      right = width;
    }

    this.eraseRectangle(top, left, bottom, right);
  },

  /**
   *
   * EL — Erase in Line
   *
   * This control function erases characters on the line that has the cursor.
   * EL clears all character attributes from erased character positions. EL
   * works inside or outside the scrolling margins.
   *
   * Format
   *
   * CSI    Ps    K
   * 9/11   3/n   4/11
   *
   * Parameters
   *
   * Ps   represents the section of the line to erase.
   *
   * Ps   Section Erased
   *      0 (default) From the cursor through the end of the line
   *      1           From the beginning of the line through the cursor
   *      2           The complete line
   */
  "[profile('vt100'), sequence('CSI Ps K')]":
  function EL(n)
  { // Erase Line

    switch (n || 0) {

      case 0: // erase to right
        this.eraseLineToRight();
        break;

      case 1: // erase to left
        this.eraseLineToLeft();
        break;

      case 2: // erase all
        this.eraseLine();
        break;

      default:
        coUtils.Debug.reportWarning(
          _("%s sequence [%s] was ignored."),
          "EL", Array.slice(arguments));
    }
  },

  /**
   *
   *  IL — Insert Line
   *
   *  This control function inserts one or more blank lines, starting at the
   *  cursor.
   *
   *  Format
   *
   *  CSI   Pn    L
   *  9/11  3/n   4/12
   *
   *  Parameters
   *
   *  Pn is the number of lines to insert.
   *
   *  Default: Pn = 1.
   *
   *  Description
   *
   *  As lines are inserted, lines below the cursor and in the scrolling region
   *  move down. Lines scrolled off the page are lost. IL has no effect outside
   *  the page margins.
   *
   */
  "[profile('vt100'), sequence('CSI Pn L')]":
  function IL(n)
  { // Insert Line
    this.insertLine(n || 1);
  },

  /**
   * DL — Delete Line
   *
   * This control function deletes one or more lines in the scrolling region,
   * starting with the line that has the cursor.
   *
   * Format
   *
   * CSI    Pn   M
   * 9/11   3/n  4/13
   *
   * Parameters
   *
   * Pn is the number of lines to delete.
   *
   * Default: Pn = 1.
   *
   * Description
   *
   * As lines are deleted, lines below the cursor and in the scrolling region
   * move up. The terminal adds blank lines with no visual character
   * attributes at the bottom of the scrolling region. If Pn is greater than
   * the number of lines
   *
   */
  "[profile('vt100'), sequence('CSI Pn M')]":
  function DL(n)
  { // Delete Line.
    this.deleteLine(n || 1);
  },

  /**
   * Delete Character (DCH)
   *
   * CSI    Pn    P
   * 9/11   3/n   5/0
   *
   *  Deletes Pn characters starting with the character at the cursor position.
   *  When a character is deleted, all characters to the right of the cursor
   *  move to the left.
   *  This creates a space character at the right margin for each character
   *  deleted.
   *  Character attributes move with the characters.
   *  The spaces created at the end of the line have all their character
   *  attributes off.
   */
  "[profile('vt100'), sequence('CSI Pn P')]":
  function DCH(n)
  { // Delete CHaracters
    this.deleteCharacters(n || 1);
  },

  /**
   * SCP - Save Cursor Position
   *
   * CSI    Pn    s
   * 9/11   3/n   7/3
   *
   * or
   *
   * DECSLRM - Set Left and Right Margins
   *
   * This control function sets the left and right margins to define the
   * scrolling region. DECSLRM only works when vertical split screen mode
   * (DECLRMM) is set.
   *
   * Available in: VT Level 4 mode only
   *
   * Default: Margins are at the left and right page borders.
   *
   * Format
   *
   * CSI        Pl      ;       Pr      s
   * 9/11       3/n     3/11    3/n     7/3
   *
   * Parameters
   *
   * Pl is the column number for the left margin.
   * Default: Pl = 1.
   *
   * Pr is the column number for the right margin.
   * Default: Pr = 80 or 132 (depending on the page width).
   *
   * Notes on DECSLRM
   *
   *     The value of the left margin (Pl) must be less than the right
   *     margin (Pr).
   *     The maximum size of the scrolling region is the page size,
   *     based on the setting of set columns per page (DECSCPP).
   *     The minimum size of the scrolling region is two columns.
   *     The terminal only recognizes this control function if vertical
   *     split screen mode (DECLRMM) is set.
   *     DECSLRM moves the cursor to column 1, line 1 of the page.
   *     If the left and right margins are set to columns other than 1
   *     and 80 (or 132), then the terminal cannot scroll smoothly.
   *
   */
  "[profile('vt100'), sequence('CSI Pn s')]":
  function DECSLRM(n1, n2)
  {
    var cursor = this._cursor;

    if (this._left_right_margin_mode) {

      n1 = (n1 || 1) - 1;
      n2 = (n2 || this._width) - 1;

      this._scroll_left = n1;
      this._scroll_right = n2 + 1;

      if (cursor.DECOM) {
        cursor.positionX = this._scroll_left;
        cursor.positionY = this._scroll_top;
      } else {
        cursor.positionX = 0;
        cursor.positionY = 0;
      } 
    } else { // DECSC
      this.sendMessage("command/backup-cursor-state");
    }
  },

  /**
   *
   * SL — Scroll Left
   *
   * Format
   *
   * CSI    Pn    SP    @
   * 9/11   3/n   2/0   4/0
   *
   * Parameter default value: Pn = 1
   *
   * SL causes the data in the presentation component to be moved by n
   * character positions if the line orientation is horizontal, or by n
   * line positions if the line orientation is vertical, such that the data
   * appear to move to the left; where n equals the value of Pn.
   * The active presentation position is not affected by this control function.
   *
   */
  "[profile('vt100'), sequence('CSI Pn SP @')]":
  function SL(n)
  { // Scroll Left
    this.scrollLeft(n || 1);
  },

  /**
   *
   * SR — Scroll Right
   *
   * Format
   *
   * CSI    Pn    SP    A
   * 9/11   3/n   2/0   4/1
   *
   * Parameter default value: Pn = 1
   *
   * SR causes the data in the presentation component to be moved by n
   * character positions if the line orientation is horizontal, or by n line
   * positions if the line orientation is vertical, such that the data appear
   * to move to the right; where n equals the value of Pn.
   * The active presentation position is not affected by this control function.
   *
   */
  "[profile('vt100'), sequence('CSI Pn SP A')]":
  function SR(n)
  { // Scroll Right
    this.scrollRight(n || 1);
  },

  /**
   * SU - Pan Down
   *
   * This control function moves the user window down a specified number of
   * lines in page memory.
   *
   * Format
   *
   * CSI    Pn    S
   * 9/11   3/n   5/3
   *
   * @param {Number} n the number of lines to move the user window down in
   *                   page memory. Pn new lines appear at the bottom of the
   *                   display. Pn old lines disappear at the top of the
   *                   display. You cannot pan past the bottom margin of the
   *                   current page.
   */
  "[profile('vt100'), sequence('CSI Pn S')]":
  function SU(n)
  { // Scroll Up line
    this.scrollUpLine(n || 1);
  },

  /**
   * SD — Pan Up
   *
   * This control function moves the user window up a specified number of
   * lines in page memory.
   *
   * Format
   *
   * CSI    Pn    T
   * 9/11   3/n   5/4
   *
   * @param {Number} n the number of lines to move the user window up in page
   *                   memory. Pn new lines appear at the top of the display.
   *                   Pn old lines disappear at the bottom of the display.
   *                   You cannot pan past the top margin of the current page.
   */
  "[profile('vt100'), sequence('CSI Pn T')]":
  function SD(n)
  { // Scroll Down line
    var argc = arguments.length;

    // check argument length
    switch (argc) {

      case 0:
        this.scrollDownLine(1);
        break;

      case 1:
        this.scrollDownLine(n);
        break;

      case 6:
        this.sendMessage(
          "event/start-highlight-mouse",
          Array.slice(arguments));
        break;

      default:
        coUtils.Debug.reportError(
          _("The size of arguments is wrong: [%s]."),
            Array.slice(arguments));

    } // switch argc
  },

  /**
   *
   * Erase Character (ECH)
   * (VT200 mode only)
   *
   * 9/11     5/8
   * CSI  Pn   X
   *
   * Erases characters at the cursor position and the next Pn-1 characters.
   * A parameter of 0 or 1 erases a single character.
   * Character attributes are set to normal. No reformatting of data on the
   * line occurs.
   * The cursor remains in the same position.
   *
   */
  "[profile('vt100'), sequence('CSI Pn X')]":
  function ECH(n)
  { // Erase CHaracters
    this.eraseCharacters(n || 1);
  },

  /**
   * HPR — Horizontal Position Relative
   *
   * Inquire as to the amount of free memory for programmable key operations.
   *
   * Format
   *
   * CSI    Pn    a
   * 9/11   3/n   6/1
   *
   * @param {Number} n indicates horizontal position.
   *
   * Description
   *
   * HPR causes the active position to be moved to the n-th following
   * horizontal position of the active line. If an attempt is made to move
   * the active position past the last position on the line, then the active
   * position stops at the last position on the line.
   */
  "[profile('vt100'), sequence('CSI Pn a')]":
  function HPR(n)
  { //
    var width = this._width;

    this.cursorForward(n || 1, width);
  },

  /**
   * HPB — Horizontal Position Backward
   *
   * Inquire as to the amount of free memory for programmable key operations.
   *
   * Format
   *
   * CSI    Pn    j
   * 9/11   3/n   6/10
   *
   * @param {Number} n indicates horizontal position.
   *
   * Parameter default value: Pn = 1
   *
   * Description
   *
   * HPB causes the active data position to be moved by n character positions
   * in the data component in the direction opposite to that of the character
   * progression, where n equals the value of Pn.
   *
   */
  "[profile('vt100'), sequence('CSI Pn j')]":
  function HPB(n)
  { //
    this.cursorBackward(n || 1, 0);
  },

  /**
   * VPA—Vertical Line Position Absolute
   *
   * VPA inquires as to the amount of free memory for programmable key operations.
   *
   * Format
   * CSI    Pn    d
   * 9/11   3/n   6/4
   *
   * @param {Number} n column number.
   *
   * Description
   *
   * VPA causes the active position to be moved to the corresponding
   * horizontal position.
   *
   * The default value is 1.
   *
   * Move cursor to line Pn. VPA causes the active position to be moved to
   * the corresponding horizontal position at vertical position Pn. If an
   * attempt is made to move the active position below the last line, then
   * the active position stops on the last line.
   */
  "[profile('vt100'), sequence('CSI Pn d')]":
  function VPA(n)
  { // set Virtical Position Absolutely
    var max = this._height - 1,
        cursor = this._cursor;

    n = (n || 1) - 1;

    if (n > max) {
      cursor.positionY = max;
    } else {
      cursor.positionY = n;
    }

  },

  /**
   * VPR — Vertical Position Relative
   *
   * @ref http://vt100.net/docs/vt520-rm/
   *
   * VPR inquires as to the amount of free memory for programmable key
   * operations.
   *
   * Format
   * CSI    Pn    e
   * 9/11   3/n   6/5
   *
   * @param {Number} n column number.
   *
   * Description
   *
   * VPR causes the active position to be moved to the corresponding
   * horizontal position.
   * This command causes the active position to be moved to the corresponding
   * horizontal position at n-th following vertical position. If an attempt
   * is made to move the active position below the last line, the active
   * position stops at the last line.
   *
   */
  "[profile('vt100'), sequence('CSI Pn e')]":
  function VPR(n)
  {
    this.cursorDown(n || 1);
  },

  /**
   * VPB — Vertical Position Relative
   *
   * @ref http://vt100.net/docs/vt520-rm/
   *
   * VPB - line position backward
   *
   * Move vertically Pn lines in the current column. The default value is 1.
   *
   * Format
   *
   * CSI   Pn   k
   * 9/11  3/n  6/11
   *
   * Parameters
   * @param {Number} n number of lines to move.
   *
   * Description
   *
   * Parameter default value: Pn = 1
   * VPB causes the active data position to be moved by n line positions in
   * the data component in a direction opposite to that of the line
   * progression, where n equals the value of Pn.
   *
   */
  "[profile('vt100'), sequence('CSI Pn k')]":
  function VPB(n)
  {
    this.cursorUp(n || 1);
  },

  /**
   * CNL — Cursor Next Line
   *
   * Move the cursor to the next line.
   *
   * Default: 1.
   *
   * Format
   * CSI    Pn    E
   * 9/11   3/n   4/5
   *
   * @param {Number} n the active position to the first character of the n-th
   *                 following line.
   *
   * Description
   *
   * The active position is moved to the first character of the n-th following line.
   */
  "[profile('vt100'), sequence('CSI Pn E')]":
  function CNL(n)
  {
    this.cursorDown(n || 1);
    this._cursor.positionX = 0;
  },

  /**
   * CPL — Cursor Previous Line
   *
   * Move the cursor to the preceding line.
   *
   * Default: 1.
   *
   * Format
   *
   * CSI    Pn    F
   * 9/11   3/n   4/6
   *
   * @param {Number} n the number of active position moved to the first
   *                   character of the n-th preceding line.
   *
   * Description
   *
   * The active position is moved to the first character of the n-th preceding line.
   */
  "[profile('vt100'), sequence('CSI Pn F')]":
  function CPL(n)
  {
    this.cursorUp(n || 1);
    this._cursor.positionX = 0;
  },

  /**
   * HPA — Horizontal Position Absolute
   *
   * Inquire as to the amount of free memory for programmable key operations.
   *
   * Format
   *
   * CSI    Pn    `
   * 9/11   3/n   6/0
   *
   * @param {Number} n indicates horizontal position.
   *
   * Description
   *
   * HPA causes the active position to be moved to the n-th horizontal
   * position of the active line. If an attempt is made to move the active
   * position past the last position on the line, then the active position
   * stops at the last position on the line.
   */
  "[profile('vt100'), sequence('CSI Pn `')]":
  function HPA(n)
  {
    var right_margin,
        cursor = this._cursor;

    n = (n || 1) - 1;

    if (this._left_right_margin_mode) {
      right_margin = this._scroll_right;
      if (cursor.DECOM) {
        n += this._scroll_left;
      }
    } else {
      right_margin = this._width;
    }

    if (n > right_margin) {
      cursor.positionX = right_margin;
    } else {
      cursor.positionX = n;
    }

  },

  /**
   *
   * REP - Repeat
   *
   * Format
   *
   * CSI Pn b
   *
   * Causes the single graphic character immediately preceding the control
   * to be repeated Pn times.
   *
   */
  "[profile('vt100'), sequence('CSI Pn b')]":
  function REP(n)
  { // REPeat the preceding graphic character
    this.repeat(n || 1);
  },

  /**
   *
   * HVP — Horizontal and Vertical Position
   *
   * This control function works the same as the cursor position (CUP)
   * function. New applications should use CUP instead of HVP. HVP is
   * provided for compatibility with earlier VT products.
   *
   * Format
   *
   * CSI    f
   * 9/11   6/6
   *
   * Cursor moves to home position selected by DECOM
   *
   * CSI    Pl    ;     Pc   f
   * 9/11   3/n   3/11  3/n  6/6
   *
   * Moves cursor to line Pl, column Pc
   *
   * Parameters
   *
   * Pl; Pc
   *
   * If Pl or Pc is not selected or selected as 0, then the cursor moves to
   * the first line or column, respectively. Origin mode (DECOM) selects line
   * numbering and the ability to move the cursor into margins.
   */
  "[profile('vt100'), sequence('CSI Pl;Pc f')]":
  function HVP(n1, n2)
  { // Horizontal and Vertical Position
    var left,
        top,
        right,
        bottom,
        cursor = this._cursor,
        y = (n1 || 1) - 1,
        x = (n2 || 1) - 1;

    if (cursor.DECOM) {
      left = this._scroll_left;
      top = this._scroll_top;
      right = this._scroll_right;
      bottom = this._scroll_bottom;
      x += left;
      y += top;
    } else {
      left = 0; 
      top = 0;
      right = this._width;
      bottom = this._height;
    }

    // set horizontal position
    if (x >= right) {
      cursor.positionX = right - 1;
    } else {
      cursor.positionX = x;
    }

    // set vertical position
    if (y >= bottom) {
      cursor.positionY = bottom - 1;
    } else {
      cursor.positionY = y;
    }
  },

  /**
   * MC - Media Copy
   *
   * MC is the control sequence that enables the terminal to control all print
   * functions. There are two variations—ANSI standard and VT mode.
   *
   * Format
   *
   * CSI    Pn      i
   * 9/11   3/n     6/9              ANSI standard.
   *
   * CSI     ?       Pn      i
   * 9/11    3/15    3/n     6/9     VT mode.
   *
   * Parameters
   *
   * Pn (ANSI standard)
   * indicates the following ANSI standard print functions:
   *
   * Pn| Action                       |  Notes on Print Page
   * --+------------------------------+----------------------------------------
   * 0 | Prints the page that has the |- The terminal stores data from the
   *   | cursor.                      |  keyboard until printing is complete.
   *   |                              |  
   *   |                              |- If printer extent mode (DECPEX) is
   *   |                              |  currently reset, then the print page 
   *   |                              |  function only prints the scrolling
   *   |                              |  region.
   * --+------------------------------+----------------------------------------
   * 2 | Sends screen data through    |
   *   | host port.                   |
   * --+------------------------------+----------------------------------------
   *
   * Pn| Action                       | Notes on Printer Controller Mode
   * --+------------------------------+----------------------------------------
   * 4 | Turns off printer controller | Printer controller mode lets the host
   *   | mode.                        | control printer operation. The terminal
   *   |                              | sends characters and control sequences
   *   |                              | directly to the printer, without
   *   |                              | displaying them on the screen.
   *   |                              | The terminal sends all characters and
   *   |                              | control sequences except NUL, XON, XOFF,
   *   |                              | and the printer controller mode
   *   |                              | sequences.
   *   |                              | Printer controller mode cancels
   *   |                              | autoprint mode. When the terminal
   *   |                              | leaves printer controller mode, it
   *   |                              | returns to the normal method for
   *   |                              | printing operations.
   *   |                              | The printer's active column position
   *   |                              | should always be on the left margin
   *   |                              | before the terminal leaves printer
   *   |                              | controller mode.
   * --+------------------------------+----------------------------------------
   *
   * Pn| Action
   * --+-----------------------------------------------------------------------
   * 5 | Turns on printer controller mode.   
   * 6 | Disables a printer-to-host session.     
   * 7 | Enables a printer-to-host session.  
   * --+-----------------------------------------------------------------------
   *
   * Pn (VT mode)
   * indicates the following VT mode print functions:
   *
   * Pn| Action                       | Note on Print Cursor Line
   * --+------------------------------+----------------------------------------
   * 1 | Prints the line that has the | The cursor does not move.
   *   | cursor.                      |
   * --+------------------------------+----------------------------------------
   *
   * Pn| Action                       | Notes on Autoprint Mode
   * --+------------------------------+----------------------------------------
   * 4 | Turns off autoprint mode.    |
   * 5 | Turns on autoprint mode.     | The printer prints a line from the
   *   |                              | screen when you move the cursor off
   *   |                              | that line with an LF, FF, or VT
   *   |                              | character, or an autowrap occurs.
   *   |                              | The printed line ends with a CR and
   *   |                              | the character (LF, FF, or VT) that
   *   |                              | moved the cursor off the previous line.
   * --+------------------------------+----------------------------------------
   *
   * Pn| Action                       | Notes on Set/Reset Printer to Host
   * --+------------------------------+----------------------------------------
   * 8 | Disables communication from  | CSI ? 8 i and CSI ? 9 i are media copy
   *   | the printer port to the host.| commands used in VT terminals to
   *   |                              | reset/set printer to host mode.
   * 9 | Enables communication from   |
   *   | the printer port to the host.|
   * --+------------------------------+----------------------------------------
   *
   * Pn| Action                       | Note on Print Screen Data
   * --+------------------------------+----------------------------------------
   * 10| Prints the data on the       | Printer extent mode (DECPEX) does not
   *   | screen.                      | affect this function.
   * --+------------------------------+----------------------------------------
   *
   * Pn| Action                       | Notes on Print All Pages
   * --+------------------------------+----------------------------------------
   * 11| Prints all pages in page     | If the current page format is 3 pages
   *   | memory.                      | of 24 lines each, the printer prints
   *   |                              | 3 pages of 24 lines.  The terminal
   *   |                              | stores new data from the keyboard until
   *   |                              | printing is complete.  If print form
   *   |                              | feed mode (DECPFF) is set, then the
   *   |                              | terminal sends a form feed (FF) to
   *   |                              | the printer after each page.
   * --+------------------------------+----------------------------------------
   *
   * Note on MC Command
   *
   * The ANSI Escape Sequences CSI 6 i and CSI 7 i to reset/set printer to host
   * mode are functionally equivalent to CSI ? 8 i and CSI ? 9 i, respectively.
   *
   */
  "[profile('vt100'), sequence('CSI Pn i')]":
  function MC(n)
  { // TODO: Media Copy
    coUtils.Debug.reportWarning(
      _("%s sequence [%s] was ignored."),
      "MC", Array.slice(arguments));
  },

  "[profile('vt100'), sequence('CSI ? Pn i')]":
  function DECMC(n)
  { // TODO: Media Copy, DEC-specific
    coUtils.Debug.reportWarning(
      _("%s sequence [%s] was ignored."),
      "DECMC", Array.slice(arguments));
  },

  "[profile('vt100'), sequence('0x98', 'ESC X')]":
  function SOS(message)
  {
    coUtils.Debug.reportWarning(
      _("Ignored %s [%s]"), "SOS", message);
  },

} // aspect ScreenSequenceHandler

/**
 * @trait Viewable
 */
var Viewable = new Trait("Viewable");
Viewable.definition = {

  _scrollback_amount: 0,

  "[subscribe('command/scroll-down-view'), pnp]":
  function scrollDownView(n)
  {
    if (0 === n || 0 === this._scrollback_amount) {
      return;
    }

    // move view position.
    if (this._scrollback_amount < n) {
      this._scrollback_amount = 0;
      // finishes scrolling session.
      this.sendMessage("event/scroll-session-closed");
    } else {
      this._scrollback_amount -= n;
    }
    this.updateScrollInformation();
  },

  "[subscribe('command/scroll-up-view'), pnp]":
  function scrollUpView(n)
  {
    var buffer_top = this.getBufferTop();

    if (0 === n || buffer_top === this._scrollback_amount) {
      return;
    }
    if (0 === this._scrollback_amount) {
      // starts scrolling session.
      this.sendMessage("event/scroll-session-started");
    }
    // move view position.
    if (buffer_top - this._scrollback_amount < n) {
      this._scrollback_amount = buffer_top;
    } else {
      this._scrollback_amount += n;
    }
    this.updateScrollInformation();
  },

  "[subscribe('command/set-scroll-position'), pnp]":
  function setViewPosition(position)
  {
    var buffer_top = this.getBufferTop();

    if (0 === this._scrollback_amount) {
      if (position !== buffer_top - this._scrollback_amount) {
        // starts scrolling session.
        this.sendMessage("event/scroll-session-started");
      }
    }
    this._scrollback_amount = buffer_top - position;
    this.updateScrollInformation();
  },

  "[subscribe('command/update-scroll-information'), pnp]":
  function updateScrollInformation()
  {
    var buffer_top = this.getBufferTop(),
        width = this._width,
        lines = this._getCurrentViewLines(),
        i,
        line;

    this.sendMessage(
      "event/scroll-position-changed",
      {
        start: buffer_top - this._scrollback_amount,
        end: buffer_top - this._scrollback_amount + this._height,
        size: buffer_top + this._height,
      });

    if (this._scrollback_amount > 0) {
      this.onBeforeInput.enabled = true;
    }

    // redraw view
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      if (line.length < width) {
        line.length = width;
      }
      line.dirty = true;
    }
  },

  _getCurrentViewLines: function _getCurrentViewLines()
  {
    var buffer_top = this.getBufferTop(),
        start = buffer_top - this._scrollback_amount,
        end = start + this._height;

    return this._buffer.slice(start, end);
  },

  "[subscribe('event/before-input')]":
  function onBeforeInput(message)
  {
    this.onBeforeInput.enabled = false;
    this._scrollback_amount = 0;
    this.updateScrollInformation();
    this.sendMessage("command/draw", true);
    this.sendMessage("event/scroll-session-closed", true);
  },

  _interracedScan: function _interracedScan(lines)
  {
    var row;

    for (row = 1; row < lines.length; row += 2) {
      yield [row, lines[row]];
    }
    for (row = 0; row < lines.length; row += 2) {
      yield [row, lines[row]];
    }
  },

  getDirtyWords: function getDirtyWords()
  {
    var lines = this._getCurrentViewLines(),
        row,
        lines,
        info;

    for ([row, line] in Iterator(lines)) {
      for (info in line.getDirtyWords()) {
        yield {
          codes: info.codes,
          row: row,
          column: info.column,
          end: info.end,
          attr: info.attr,
          line: line,
        };
      }
    }
  },

  /** Gets the range of surround characters.
   *
   * ex.
   *
   *         point
   *           v
   * 123 abcdefghijk lmnop
   *     ^          ^
   *   start       end
   *
   */
  getWordRangeFromPoint: function getWordRangeFromPoint(column, row)
  {
    var lines = this._getCurrentViewLines(),
        line = lines[row],
        start,
        end,
        offset,
        range;

    if (!line) {
      throw coUtils.Debug.Exception(
        _("Invalid parameter was passed. ",
          "Probably 'row' parameter was in out of range. row: [%d]."),
        row);
    }

    range = line.getWordRangeFromPoint(column);

    start = range[0];
    end = range[1];

    offset = this._width * row;

    return [offset + start, offset + end];
  },

  _getTextInRectangle:
  function _getTextInRectangle(lines, start_column, end_column, raw)
  {
    var buffer = [],
        max_column,
        min_column,
        line,
        text,
        i = 0,
        buffer;

    // Rectangle selection mode.
    if (start_column < end_column) {
      max_column = end_column;
      min_column = start_column;
    } else {
      max_column = start_column;
      min_column = end_column;
    }

    for (; i < lines.length; ++i) {
      line = lines[i];
      text = line.getTextInRange(min_column, max_column, raw);
      buffer.push(text.replace(/ +$/, ""));
    }
    return buffer.join("\n");
  },

  _getTextInRangeImpl:
  function _getTextInRangeImpl(lines, start_column, end_column, raw)
  {
    var buffer = [],
        width = this._width,
        i,
        line,
        start,
        end,
        text;

    // Line selection mode.
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];

      if (0 === i) {
        start = start_column;
      } else {
        start = 0;
      }

      if (lines.length - 1 === i) {
        end = end_column;
      } else {
        end = width;
      }

      text = line.getTextInRange(start, end, raw);
      buffer.push(text.replace(/ +$/, "\n"));
    }
    return buffer.join("\r");
  },

  /** get raw text in specified range.
   */
  getRawTextInRange: function getRawTextInRange(start, end, is_rectangle)
  {
    var width = this._width,
        start_column = start % width,
        end_column = end % width,
        start_row = Math.floor(start / width),
        end_row = Math.floor(end / width) + 1,
        lines = this._getCurrentViewLines().slice(start_row, end_row);

    return this._getTextInRangeImpl(lines, start_column, end_column, /* raw */true);
  },

  /** get UTF-16 text in specified range.
   */
  getTextInRange: function getTextInRange(start, end, is_rectangle)
  {
    var width = this._width,
        start_column = start % width,
        end_column = end % width,
        start_row = Math.floor(start / width),
        end_row = Math.floor(end / width) + 1,
        lines = this._getCurrentViewLines().slice(start_row, end_row);

    return this._getTextInRangeImpl(lines, start_column, end_column, /* raw */false);
  },

  /** get raw character in specified position.
   */
  getCharacter: function getCharacter(start)
  {
    var end = start + 1,
        width = this._width,
        start_column = start % width,
        end_column = end % width,
        start_row = Math.floor(start / width),
        end_row = Math.floor(end / width) + 1,
        lines = this._getCurrentViewLines().slice(start_row, end_row);

    return this._getTextInRangeImpl(lines, start_column, end_column, /* raw */true);
  },

  /** get UTF-16 text in specified rectangular range.
   */
  getTextInRect: function getTextInRect(start, end)
  {
    var width = this._width,
        start_column = start % width,
        end_column = end % width,
        start_row = Math.floor(start / width),
        end_row = Math.floor(end / width) + 1,
        lines = this._getCurrentViewLines().slice(start_row, end_row);

    return this._getTextInRectangle(lines, start_column, end_column, /* raw */false);
  },

}; // Viewable



/**
 * @trait Scrollable
 *
 */
var Scrollable = new Trait("Scrollable");
Scrollable.definition = {

  "[persistable] scrollback_limit": 500,
  "[persistable] smooth_scrolling_delay": 10,

  _smooth_scrolling: false,

  "[subscribe('command/change-scrolling-mode'), pnp]":
  function onScrollingModeChanged(mode)
  {
    this._smooth_scrolling = false;
  },

  /** Scroll up the buffer by n lines. */
  _scrollDown: function _scrollDown(top, bottom, n)
  {
    var lines = this._buffer,
        offset = this.getBufferTop(),
        width = this._width,
        height = this._height,
        left = this._scroll_left,
        right = this._scroll_right,
        attrvalue = this._cursor.attr.value,
        i,
        j,
        cell,
        tmprange,
        rotaterange,
        line,
        range;

    if (0 === left && right === width) {
      // set dirty flag.
      for (i = offset + top; i < offset + bottom - n; ++i) {
        line = lines[i];
        line.invalidate();
      }

      // rotate lines.
      range = lines.splice(offset + bottom - n, n);

      for (i = 0; i < range.length; ++i) {
        line = range[i];
        line.erase(0, width, attrvalue);
        line.type = coUtils.Constant.LINETYPE_NORMAL;
      }

      range.unshift(offset + top, 0);

      Array.prototype.splice.apply(lines, range);
      this._lines = lines.slice(offset, offset + height);

      if (this._smooth_scrolling) {
        this.sendMessage("command/draw", true);
        wait(this.smooth_scrolling_delay);
      }
    } else {
      range = lines.slice(offset + top, offset + bottom);
      tmprange = [];
      for (i = 0; i < range.length; ++i) {
        line = range[i];
        tmprange.push(line.cells.splice(left, right - left));
      }
      rotaterange = tmprange.splice(bottom - top - n, n);
      for (i = 0; i < rotaterange.length; ++i) {
        line = rotaterange[i];
        for (j = 0; j < line.length; ++j) {
          cell = line[j];
          cell.erase(attrvalue);
        }
      }
      Array.prototype.unshift.apply(tmprange, rotaterange)
      for (i = 0; i < range.length; ++i) {
        line = range[i];
        tmprange[i].unshift(left, 0);
        Array.prototype.splice.apply(line.cells, tmprange[i]);
        line.addRange(left, right);
      }
    }
  },

  /** Scroll down the buffer by n lines. */
  _scrollUp: function _scrollUp(top, bottom, n)
  {
    var lines = this._buffer,
        offset = this._buffer_top,
        width = this._width,
        height = this._height,
        cursor = this._cursor,
        left = this._scroll_left,
        right = this._scroll_right,
        attrvalue = cursor.attr.value,
        i,
        j,
        cell,
        tmprange,
        rotaterange,
        range,  // rotation range
        line,
        rest;

    if (0 === left && right === width) {
      // set dirty flag.
      for (i = offset + top + n; i < offset + bottom; ++i) {
        line = lines[i];
        line.invalidate();
      }
      // rotate lines.
      rest = this.scrollback_limit - offset;
      if (top > 0) {
        range = lines.splice(offset + top, n);
        for (i = 0; i < range.length; ++i) {
          line = range[i];
          line.erase(0, width, attrvalue);
          line.type = coUtils.Constant.LINETYPE_NORMAL;
        }
      } else if (rest > 0) {
        if (n > rest) {
          range = this._createLines(rest);
          offset = this._buffer_top += rest;
          for (i = 0; i < range.length; ++i) {
            line = range[i];
            line.invalidate();
          }
          // line.splice(offset + bottom -m, 0, ....);
          range.unshift(offset + bottom - rest, 0);
          Array.prototype.splice.apply(lines, range);
          this._lines = lines.slice(offset, offset + height);
          this._scrollUp(top, bottom, n - rest)
          return;
        } else {
          range = this._createLines(n);
          offset = this._buffer_top += n;
          for (i = 0; i < range.length; ++i) {
            line = range[i];
            line.invalidate();
          }
        }
      } else { // 0 === top && rest === 0
        range = lines.splice(0, n);
        for (i = 0; i < range.length; ++i) {
          line = range[i];
          line.erase(0, width, attrvalue);
          line.length = width;
          line.invalidate();
          line.type = coUtils.Constant.LINETYPE_NORMAL;
        }
      }

      // line.splice(offset + bottom -m, 0, ....);
      range.unshift(offset + bottom - n, 0);
      Array.prototype.splice.apply(lines, range);
      this._lines = lines.slice(offset, offset + height);

      if (this._smooth_scrolling) {
        this.sendMessage("command/draw", true);
        wait(this.smooth_scrolling_delay);
      }
    } else {
      range = lines.slice(offset + top, offset + bottom);
      tmprange = [];
      for (i = 0; i < range.length; ++i) {
        line = range[i];
        tmprange.push(line.cells.splice(left, right - left));
      }
      rotaterange = tmprange.splice(0, n);
      for (i = 0; i < rotaterange.length; ++i) {
        line = rotaterange[i];
        for (j = 0; j < line.length; ++j) {
          cell = line[j];
          cell.erase(attrvalue);
        }
      }
      Array.prototype.push.apply(tmprange, rotaterange)
      for (i = 0; i < range.length; ++i) {
        line = range[i];
        tmprange[i].unshift(left, 0);
        Array.prototype.splice.apply(line.cells, tmprange[i]);
        line.addRange(left, right);
      }
    }

  },

}; // Scrollable

/**
 * @trait Resizable
 */
var Resizable = new Trait("Resizable");
Resizable.definition = {

  /** Pop and Remove last n lines from screen. */
  _popLines: function _popLines(n)
  {
    var buffer = this._buffer,
        offset = this._buffer_top;

    buffer.splice(-n);
    buffer.splice(-this._height, n);

    // decrease height.
    this._height -= n;

    this._lines = buffer.slice(offset, offset + this._height);

    // collapse scroll region.
    this._scroll_bottom -= n;

    // fix cursor position.
    if (this._cursor.positionY >= this._height) {
      this._cursor.positionY = this._height - 1;
    }
  },

  /** Create new lines and Push after last line. */
  _pushLines: function _pushLines(n)
  {
    var buffer = this._buffer,
        new_lines = this._createLines(n),
        offset = this._buffer_top;

    // increase height.
    this._height += n;

    Array.prototype.push.apply(buffer, new_lines);

    new_lines = this._createLines(n);
    new_lines.unshift(-this._height, 0); // make arguments
    Array.prototype.splice.apply(buffer, new_lines);

    this._lines = buffer.slice(offset, offset + this._height);

    // expand scroll region.
    this._scroll_bottom += n;
  },

  /** Pop and Remove last n columns from screen. */
  _popColumns: function _popColumns(n)
  {
    // decrease width
    var cursor = this._cursor,
        width = this._width -= n,
        lines = this._lines,
        i,
        line;

    // set new width.
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      line.length = width;
    }

    // fix cursor position.
    if (cursor.positionX >= width) {
      cursor.positionX = width - 1;
    }

  },

  /** Create new colmuns and Push after last column. */
  _pushColumns: function _pushColumns(n)
  {
    // increase width
    var width = this._width += n,
        lines = this._lines,
        i,
        line;

    // set new width.
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      line.length = width;
    }
  },

}; // Resize


/**
 * @class Screen
 * @brief The Screen class, manages Line objects and provides some functions,
 *        scroll, line operation, buffer-switching,...etc.
 */
var Screen = new Class().extends(Plugin)
                        .mix(Viewable)
                        .mix(Scrollable)
                        .mix(Resizable)
                        .mix(ScreenSequenceHandler)
                        .requires("ScreenSwitch")
                        .requires("ScreenBackup")
                        .requires("ScreenCursorOperations")
                        .requires("ScreenEdit")
                        .depends("cursorstate")
                        .depends("linegenerator")
                        ;
Screen.definition = {

  /** Component ID */
  id: "screen",

  getInfo: function getInfo()
  {
    return {
      name: _("Screen"),
      version: "0.1.0",
      description: _("Provides terminal screen buffer and some",
                     " functions for operating it.")
    };
  },

  "[persistable] enabled_when_startup": true,

  /**
   * @property cursor
   * @brief Manages cursor position and some attributes.
   */
  _cursor: null,
  _buffer: null,
  _buffer_top: 0,
  _lines: null,
  _width: 80,
  _height: 24,
  _scroll_top: null,
  _scroll_left: null,
  _scroll_right: null,
  _scroll_bottom: null,
  _screen_choice: coUtils.Constant.SCREEN_MAIN,
  _line_generator: null,

  _wraparound_mode: true,
  _insert_mode: false,
  _reverse_wraparound_mode: false,
  _left_right_margin_mode: false,

  // geometry (in cell count)
  "[persistable] initial_column": 80,
  "[persistable] initial_row": 24,

  // determine whether or not back-scroll buffer is serialized
  "[persistable] backup_scrollbuffer": false,

  /** Installs itself.
   *  @param {InstallContext} context A InstallContext object.
   */
  "[install]":
  function install(context)
  {
    var line_generator = context["linegenerator"],
        cursor_state = context["cursorstate"];

    this._buffer = line_generator.allocate(this._width, this._height * 2, 0);
    this._switchScreen();
    this._cursor = cursor_state;
    this._line_generator = line_generator;

    this.resetScrollRegion();
  },

  /** uninstalls itself.
   */
  "[uninstall]":
  function uninstall()
  {
    this._buffer = null;
    this._line_generator = null;
    this._cursor = null;

    this._buffer_top = 0;
    this._lines = null;
    this._width = 80;
    this._height = 24;

    this._scroll_top = null;
    this._scroll_bottom = null;
    this._scroll_left = null;
    this._scroll_right = null;
    this._screen_choice = coUtils.Constant.SCREEN_MAIN;
    this._line_generator = null;

    this._wraparound_mode = true;
    this._insert_mode = false;
    this._reverse_wraparound_mode = false;
    this._left_right_margin_mode = false;
  },

  /**
   * @property dirty
   */
  get dirty()
  {
    var lines = this._lines,
        line,
        i;

    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      if (line.dirty) {
        return true;
      }
    }
  },

  set dirty(value)
  {
    var lines = this._lines,
        line,
        i;

    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      line.dirty = value;
    }
  },

  /**
   * @property width
   * Screen width in counting the number of columns.
   */
  get "[persistable] width"()
  {
    return this._width;
  },

  set "[persistable] width"(value)
  {
    var width,
        cursor,
        new_width;

    if (this._buffer) {

      width = this._width;

      if (value === width) {
        return;
      } else if (width < value) {
        this._pushColumns(value - width);
      } else if (width > value) {
        this._popColumns(width - value);
      }

      cursor = this._cursor;
      new_width = this._width;
      if (cursor.positionX >= new_width) {
        cursor.positionX = new_width - 1;
      }

      this.sendMessage(
        "variable-changed/screen.width",
        new_width);
    } else {
      this._width = value;
    }
    this._scroll_right = this._width;
    this._left_right_margin_mode = false;
  },

  /**
   * @property height
   * Screen height in counting the number of lines.
   */
  get "[persistable] height"()
  {
    return this._height;
  },

  set "[persistable] height"(value)
  {
    var cursor;

    if (this._buffer) {
      if (value === this._height) {
        return;
      } else if (this._height < value) {
        this._pushLines(value - this._height);
      } else if (this._height > value) {
        this._popLines(this._height - value);
      }

      // I Wonder if we should trim cursor position when screen is resized.
      cursor = this._cursor;

      if (cursor.positionY >= this._height) {
        cursor.positionY = this._height - 1;
      }

      this.sendMessage("variable-changed/screen.height", this._height);
    } else {
      this._height = value;
    }
  },

  getScrollTop: function getScrollTop()
  {
    return this._scroll_top;
  },

  getScrollBottom: function getScrollBottom()
  {
    return this._scroll_bottom;
  },

  getBufferTop: function getBufferTop()
  {
    return this._buffer_top;
  },

  /** Detects whether caracter that is assigned current cursor position is
   *  wide.
   */
  get currentCharacterIsWide()
  {
    var line = this.getCurrentLine();

    if (!line) {
      return false;
    }
    return line.isWide(this._cursor.positionX);
  },

  "[subscribe('command/enable-insert-mode'), pnp]":
  function enableInsertMode()
  {
    this._insert_mode = true;
  },

  "[subscribe('command/disable-insert-mode'), pnp]":
  function disableInsertMode()
  {
    this._insert_mode = false;
  },

  /** enable wraparound mode */
  "[subscribe('command/enable-wraparound'), pnp]":
  function enableWraparound()
  {
    this._wraparound_mode = true;
  },

  /** disable wraparound mode */
  "[subscribe('command/disable-wraparound'), pnp]":
  function disableWraparound()
  {
    this._wraparound_mode = false;
  },

  /** enable reverse wraparound mode */
  "[subscribe('command/enable-reverse-wraparound'), pnp]":
  function enableReverseWraparound()
  {
    this._reverse_wraparound_mode = true;
  },

  /** disable reverse wraparound mode */
  "[subscribe('command/disable-reverse-wraparound'), pnp]":
  function disableReverseWraparound()
  {
    this._reverse_wraparound_mode = false;
  },

  /** enable/disable left/right margin mode */
  "[subscribe('command/change-left-right-margin-mode'), pnp]":
  function onChangeLeftRightMarginMode(mode)
  {
    var lines = this._lines,
        length = lines.length,
        i,
        line;

    for (i = 0; i < length; ++i) {
      line = lines[i];
      line.type = coUtils.Constant.LINETYPE_NORMAL;
    }

    this._left_right_margin_mode = mode;

  },

  /** Write printable charactor seqences. */
  "[subscribe('command/write'), type('Array -> Boolean -> Undefined'), pnp]":
  function write(codes)
  {
    var insert_mode = this._insert_mode,
        cursor = this._cursor,
        it = 0,
        line = this.getCurrentLine(),
        positionX = cursor.positionX,
        length,
        run,
        attrvalue,
        right_margin;

    if (this._left_right_margin_mode) {
      right_margin = this._scroll_right;
    } else {
      right_margin = this._width;
    }

    if (0 === codes[0]) {
      if (positionX >= right_margin) {
        attrvalue = cursor.attr.value;
        line.erase(positionX - 1, positionX, attrvalue);
      }
    } else {
      if (positionX >= right_margin) {
        if (this._wraparound_mode) {
          this.carriageReturn();
          this.lineFeed();
          line = this.getCurrentLine();
        } else {
          cursor.positionX = right_margin - 1;
        }
      }
    }

    do {
      if (line) {
        if (cursor.positionX >= right_margin) {
          if (this._wraparound_mode) {
            this.carriageReturn();
            this.lineFeed();
            line = this.getCurrentLine();
          } else {
            cursor.positionX = right_margin - 1;
            break;
          }
        }

        positionX = cursor.positionX;
        length = right_margin - positionX;
        run = codes.slice(it, it + length);
        length = run.length;
        cursor.positionX += length;

        if (0 === run[length - 1]) {
          it += length - 1;
        } else {
          it += length;
        }
        line.write(positionX, run, cursor.attr, insert_mode, right_margin);

      } else {
        break;
      }
    } while (it < codes.length);

    if (undefined !== run) {
      this._last_char = run.pop();
    }
  },

  /** REPeat the preceding graphic character */
  repeat: function repeat(n)
  {
    var width = this._width,
        codes = [],
        last_char = this._last_char,
        full_count = (this.scrollback_limit + this._height) * width,
        i;

    if (n > full_count) {
      surplus = n % this._width;
      n = full_count + n % width;
    }

    for (i = 0; i < n; ++i) {
      codes.push(last_char);
    }

    this.write(codes);
  },

// ScreenCursorOperations Implementation.
  //
  // Cursor operations
  //
  /** Move cursor to forward (right). */
  "[type('Uint16 -> Undefined')] cursorForward":
  function cursorForward(n, right_margin)
  {
    var cursor = this._cursor,
        positionX = cursor.positionX + n,
        max = right_margin - 1;

    if (positionX > max) {
      cursor.positionX = max;
    } else {
      cursor.positionX = positionX;
    }
  },

  /** Move cursor to backward (left). */
  "[type('Uint16 -> Undefined')] cursorBackward":
  function cursorBackward(n, left_margin)
  {
    var width = this._width,
        cursor = this._cursor,
        positionX = cursor.positionX,
        min = left_margin;

    if (positionX > width - 1) {
      positionX = width - 1;
    }

    cursor = this._cursor;
    positionX = positionX - n;

    if (positionX > min) {
      cursor.positionX = positionX;
    } else {
      cursor.positionX = min;
    }
  },

  /** Move CUrsor Up (CUU). */
  "[type('Uint16 -> Undefined')] cursorUp":
  function cursorUp(n)
  {
    var cursor = this._cursor,
        positionY = cursor.positionY - n,
        min = this._scroll_top;

    if (positionY > min) {
      cursor.positionY = positionY;
    } else {
      cursor.positionY = min;
    }
  },

  /** Move CUrsor Down (CUD). */
  "[type('Uint16 -> Undefined')] cursorDown":
  function cursorDown(n)
  {
    var cursor = this._cursor,
        positionY = cursor.positionY + n,
        max = this._scroll_bottom - 1;

    // If an attempt is made to move the active position below the last line,
    // the active position stops at the last line.
    if (positionY > max) {
      cursor.positionY = max;
    } else {
      cursor.positionY = positionY;
    }
  },

  /** Move CUrsor Up (CUU). */
  "[type('Uint16 -> Undefined')] cursorUpAbsolutely":
  function cursorUpAbsolutely(n)
  {
    var cursor = this._cursor,
        positionY = cursor.positionY - n,
        min = 0;

    if (positionY > min) {
      cursor.positionY = positionY;
    } else {
      cursor.positionY = min;
    }
  },

  /** Move CUrsor Down (CUD). */
  "[type('Uint16 -> Undefined')] cursorDownAbsolutely":
  function cursorDownAbsolutely(n)
  {
    var cursor = this._cursor,
        positionY = cursor.positionY + n,
        max = this._height - 1;

    // If an attempt is made to move the active position below the last line,
    // the active position stops at the last line.
    if (positionY > max) {
      cursor.positionY = max;
    } else {
      cursor.positionY = positionY;
    }
  },

  /** cursor CHaracter Absolute column (CHA). */
  "[type('Uint16 -> Undefined')] setPositionX":
  function setPositionX(n)
  {
    var max = this._width - 1,
        cursor = this._cursor;

    if (n > max) {
      cursor.positionX = max;
    } else {
      cursor.positionX = n;
    }
  },

  /** set Virtical Position Absolutely (VPA). */
  "[type('Uint16 -> Undefined')] setPositionY":
  function setPositionY(n)
  {
    var max = this._height - 1,
        cursor = this._cursor;

    if (n > max) {
      cursor.positionY = max;
    } else {
      cursor.positionY = n;
    }
  },


  /** BackSpace (BS). */
  "[type('Undefined')] backSpace":
  function backSpace()
  {
    var cursor = this._cursor,
        width = this._width,
        positionX = cursor.positionX,
        left_margin,
        right_margin;

    if (positionX >= width) {
      positionX = width - 1;
    }

    if (this._left_right_margin_mode) {
      left_margin = this._scroll_left;
    } else {
      left_margin = 0;
    }

    if (positionX > left_margin) {
      cursor.positionX = positionX - 1;
    } else if (this._reverse_wraparound_mode) { // positionX === 0
      //this.reverseIndex();
      this.cursorUp(1);
      right_margin = this._scroll_right;
      cursor.positionX = right_margin - 1;
    }
  },

  /** CarriageReturn (CR). */
  "[type('Undefined')] carriageReturn":
  function carriageReturn()
  {
    var cursor = this._cursor;

    if (this._left_right_margin_mode) {
      cursor.positionX = this._scroll_left;
    } else {
      cursor.positionX = 0;
    }
  },

  "[type('Undefined')] reportCursorPosition":
  function reportCursorPosition()
  {
    var cursor = this._cursor,
        message,
        x,
        y;
    
    if (cursor.DECOM) {
      if (this._left_right_margin_mode) {
        x = cursor.positionX - this._scroll_left;
      } else {
        x = cursor.positionX;
      }
      y = cursor.positionY - this._scroll_top;
    } else {
      x = cursor.positionX;
      y = cursor.positionY;
    }

    message = coUtils.Text.format("%d;%dR", y + 1, x + 1);

    this.sendMessage("command/send-sequence/csi", message);
  },

// ScreenEditConcept implementation
  /** Erase cells from current position to end of line. */
  "[type('Undefined')] eraseLineToRight":
  function eraseLineToRight()
  {
    var line = this.getCurrentLine(),
        cursor,
        width,
        attrvalue;

    if (line) {
      cursor = this._cursor;
      width = this._width;
      attrvalue = cursor.attr.value;
      line.erase(cursor.positionX, width, attrvalue);
    } else {
      coUtils.Debug.reportWarning(
        _("eraseLineToRight: Current line is null."));
    }
  },

  /** Erase cells from specified position to head of line. */
  "[type('Undefined')] eraseLineToLeft":
  function eraseLineToLeft()
  {
    var cursor = this._cursor,
        line = this.getCurrentLine(),
        attrvalue = cursor.attr.value;

    line.erase(0, cursor.positionX + 1, attrvalue);
  },

  /** Erase current line */
  "[type('Undefined')] eraseLine":
  function eraseLine()
  {
    var cursor = this._cursor,
        line = this.getCurrentLine(),
        width = this._width,
        attrvalue = cursor.attr.value;

    line.erase(0, width, attrvalue);
  },

  /** Erase cells marked as "erasable" from current position to end
   *  of line. */
  "[type('Undefined')] selectiveEraseLineToRight":
  function selectiveEraseLineToRight()
  {
    var line = this.getCurrentLine(),
        cursor,
        width,
        attrvalue;

    if (line) {
      cursor = this._cursor;
      width = this._width;
      attrvalue = cursor.attr.value;
      line.selectiveErase(cursor.positionX, width, attrvalue);
    } else {
      coUtils.Debug.reportWarning(
        _("selectiveEraseLineToRight: Current line is null."));
    }
  },

  /** Erase cells marked as "erasable" from specified position to head
   *  of line. */
  "[type('Undefined')] selectiveEraseLineToLeft":
  function selectiveEraseLineToLeft()
  {
    var line = this.getCurrentLine(),
        cursor,
        width,
        attrvalue;

    if (line) {
      cursor = this._cursor;
      width = this._width;
      attrvalue = cursor.attr.value;
      line.selectiveErase(0, cursor.positionX + 1, attrvalue);
    } else {
      coUtils.Debug.reportWarning(
        _("selectiveEraseLineToLeft: Current line is null."));
    }
  },

  /** Erase cells marked as "erasable" from line */
  "[type('Undefined')] selectiveEraseLine":
  function selectiveEraseLine()
  {
    var line = this.getCurrentLine(),
        cursor,
        width,
        attrvalue;

    if (line) {
      cursor = this._cursor;
      width = this._width;
      attrvalue = cursor.attr.value;
      line.selectiveErase(0, width, attrvalue);
      line.selectiveErase(0, cursor.positionX + 1, attrvalue);
    } else {
      coUtils.Debug.reportWarning(
        _("selectiveEraseLine: Current line is null."));
    }
  },

  /** Erase cells from current position to head of buffer. */
  "[type('Undefined')] eraseScreenAbove":
  function eraseScreenAbove()
  {
    var cursor = this._cursor,
        width = this._width,
        lines = this._lines,
        attrvalue = cursor.attr.value,
        positionY = cursor.positionY,
        i,
        line;

    lines[positionY].erase(0, cursor.positionX + 1, attrvalue);

    for (i = 0; i < positionY; ++i) {
      line = lines[i];
      line.erase(0, width, attrvalue);
    }
  },

  /** Erase cells from current position to end of buffer. */
  "[type('Undefined')] eraseScreenBelow":
  function eraseScreenBelow()
  {
    var cursor = this._cursor,
        width = this._width,
        attrvalue = cursor.attr.value,
        lines = this._lines,
        positionY = cursor.positionY,
        height = this._height,
        i,
        line;

    line = lines[positionY];
    if (!line) {
      positionY = cursor.positionY = height - 1;
      line = lines[positionY];
    }

    line.erase(cursor.positionX, width, attrvalue);
    for (i = positionY + 1; i < height; ++i) {
      line = lines[i];
      line.erase(0, width, attrvalue);
    }
  },

  /** Erase every cells in screen. */
  "[type('Undefined')] eraseScreenAll":
  function eraseScreenAll()
  {
    var width = this._width,
        cursor = this._cursor,
        lines = this._lines,
        attrvalue = cursor.attr.value,
        length = lines.length,
        i,
        line;

    for (i = 0; i < length; ++i) {
      line = lines[i];
      line.erase(0, width, attrvalue);
      line.type = coUtils.Constant.LINETYPE_NORMAL;
    }
  },

  /** Erase every cells in rectanglar area. */
  "[type('Undefined')] eraseRectangle":
  function eraseRectangle(top, left, bottom, right)
  {
    var cursor = this._cursor,
        lines = this._lines,
        attrvalue = cursor.attr.value,
        length = lines.length,
        i = top,
        line;

    for (; i < bottom; ++i) {
      line = lines[i];
      line.erase(left, right, attrvalue);
      line.type = coUtils.Constant.LINETYPE_NORMAL;
    }
  },

  /** Erase scrollback. */
  "[type('Undefined')] eraseScrollback":
  function eraseScrollback()
  {
    this._buffer = this._buffer.slice(this._buffer_top);
    this._buffer_top = 0;
  },

  /** Erase cells from current position to head of buffer. */
  "[type('Undefined')] selectiveEraseScreenAbove":
  function selectiveEraseScreenAbove()
  {
    var cursor = this._cursor,
        width = this._width,
        lines = this._lines,
        attrvalue = cursor.attr.value,
        positionY = cursor.positionY,
        i = 0,
        line = lines[positionY];

    line.selectiveErase(0, cursor.positionX + 1, attrvalue);

    for (; i < positionY; ++i) {
      line = lines[i];
      line.selectiveErase(0, width, attrvalue);
    }
  },

  /** Erase cells from current position to end of buffer. */
  "[type('Undefined')] selectiveEraseScreenBelow":
  function selectiveEraseScreenBelow()
  {
    var cursor = this._cursor,
        width = this._width,
        attrvalue = cursor.attr.value,
        lines = this._lines,
        positionY = cursor.positionY,
        height = this._height,
        i,
        line;

    line = lines[positionY];
    line.selectiveErase(cursor.positionX, width, attrvalue);

    for (i = positionY + 1; i < height; ++i) {
      line = lines[i];
      line.selectiveErase(0, width, attrvalue);
    }
  },

  /** Erase every cells marked as "erasable" in screen. */
  "[type('Undefined')] selectiveEraseScreenAll":
  function selectiveEraseScreenAll()
  {
    var width = this._width,
        cursor = this._cursor,
        lines = this._lines,
        attrvalue = cursor.attr.value,
        length = lines.length,
        i = 0,
        line;

    for (; i < length; ++i) {
      line = lines[i];
      line.selectiveErase(0, width, attrvalue);
      line.type = coUtils.Constant.LINETYPE_NORMAL;
    }
  },

  /** Erase every cells marked as "erasable" in rectanglar area. */
  "[type('Undefined')] selectiveEraseRectangle":
  function selectiveEraseRectangle(top, left, bottom, right)
  {
    var cursor = this._cursor,
        lines = this._lines,
        attrvalue = cursor.attr.value,
        length = lines.length,
        i = top,
        line;

    for (; i < bottom; ++i) {
      line = lines[i];
      line.selectiveErase(left, right, attrvalue);
      line.type = coUtils.Constant.LINETYPE_NORMAL;
    }
  },

  /** Erase every cells in screen. */
  "[type('Undefined')] eraseScreenAllWithTestPattern":
  function eraseScreenAllWithTestPattern()
  {
    var attrvalue = this._cursor.attr.value,
        width = this._width,
        lines = this._lines,
        i = 0,
        line;

    for (; i < lines.length; ++i) {
      line = lines[i];
      line.eraseWithTestPattern(0, width, attrvalue);
    }
  },

  /** Insert n cells at specified position. */
  "[type('Uint16 -> Undefined')] insertBlanks":
  function insertBlanks(n)
  {
    var line = this.getCurrentLine(),
        cursor = this._cursor,
        positionX = cursor.positionX,
        attrvalue = cursor.attr.value,
        left_margin,
        right_margin;

    if (this._left_right_margin_mode) {
      // respect left-right margin
      left_margin = this._scroll_left;
      right_margin = this._scroll_right;
      if (positionX < left_margin || positionX >= right_margin) {
        // ICH has no effect outside the scrolling margins.
        return;
      }
    } else {
      right_margin = this._width;
    }
    line.insertBlanks(positionX, n, attrvalue, right_margin);
  },

  "[type('Uint16 -> Uint16 -> Undefined')] setScrollRegion":
  function setScrollRegion(top, bottom)
  {
    var cursor = this._cursor;

    this._scroll_top = top;
    this._scroll_bottom = bottom;

    if (cursor.DECOM) {
      cursor.positionX = this._scroll_left;
      cursor.positionY = top;
    } else {
      cursor.positionX = 0;
      cursor.positionY = 0;
    } 

  },

  "[type('Undefined')] resetScrollRegion":
  function resetScrollRegion()
  {
    this._scroll_top = 0;
    this._scroll_bottom = this._height;
    this._scroll_left = 0
    this._scroll_right = this._width;
  },

  "[subscribe('command/soft-terminal-reset'), pnp]":
  function softReset()
  {
    var lines,
        i = 0,
        line;

    this.switchToMainScreen();
    this.resetScrollRegion();

    lines = this._getCurrentViewLines();

    for (; i < lines.length; ++i) {
      line = lines[i];
      line.type = coUtils.Constant.LINETYPE_NORMAL;
    }
  },

  "[subscribe('command/hard-terminal-reset'), pnp]":
  function reset()
  {
    this.eraseScreenAll();
    this.softReset();
  },

  /** Reverse Index (RI) */
  "[type('Undefined')] reverseIndex":
  function reverseIndex()
  { // cursor up
    var cursor_state = this._cursor,
        top = this._scroll_top,
        positionY = cursor_state.positionY;

    if (positionY === top) {
      this._scrollDown(top, this._scroll_bottom, 1);
    } else if (positionY < top) {
      cursor_state.positionY = top
      this._scrollDown(top, this._scroll_bottom, 1);
    } else {
      --cursor_state.positionY;
    }
  },

  /** Line Feed (LF) */
  "[type('Undefined')] lineFeed":
  function lineFeed()
  { // cursor down
    var cursor = this._cursor,
        top,
        bottom = this._scroll_bottom,
        positionY = cursor.positionY;

    if (positionY === bottom - 1) {
      this._scrollUp(this._scroll_top, bottom, 1);
    } else if (positionY > bottom - 1) {
      cursor.positionY = bottom - 1;
      this._scrollUp(this._scroll_top, bottom, 1);
    } else {
      ++cursor.positionY;
    }
  },

  /** insert n lines */
  "[type('Uint16 -> Undefined')] insertLine":
  function insertLine(n)
  { // Insert Line
    var positionY = this._cursor.positionY,
        bottom = this._scroll_bottom,
        delta = Math.min(n, bottom - positionY);

    this._scrollDown(positionY, bottom, delta);
  },

  /** delete n lines */
  "[type('Uint16 -> Undefined')] deleteLine":
  function deleteLine(n)
  { // Delete Line.
    var positionY = this._cursor.positionY,
        bottom = this._scroll_bottom,
        delta = Math.min(n, bottom - positionY);

    this._scrollUp(positionY, bottom, delta);
  },

  /** scroll left n columns */
  "[type('Uint16 -> Undefined')] scrollLeft":
  function scrollLeft(n)
  { // Scroll Left
    var lines = this._lines,
        attrvalue = this._cursor.attr.value,
        i = 0,
        j = 0,
        leftmargin = this._scroll_left,
        rightmargin = this._scroll_right,
        range,
        cells,
        cell;

    for (; i < lines.length; ++i) {
      cells = lines[i].cells;
      range = cells.splice(leftmargin, n);
      for (; j < range.length; ++j) {
        cell = range[j];
        cell.erase(attrvalue);
      }
      range.unshift(rightmargin - n, 0);
      Array.prototype.splice.apply(cells, range);
    }
  },

  /** scroll right n columns */
  "[type('Uint16 -> Undefined')] scrollRight":
  function scrollRight(n)
  { // Scroll Right
    var lines = this._lines,
        attrvalue = this._cursor.attr.value,
        i = 0,
        j = 0,
        leftmargin = this._scroll_left,
        rightmargin = this._scroll_right,
        range,
        cells,
        cell;

    for (; i < lines.length; ++i) {
      cells = lines[i].cells;
      range = cells.splice(rightmargin - n, n);
      for (; j < range.length; ++j) {
        cell = range[j];
        cell.erase(attrvalue);
      }
      range.unshift(leftmargin, 0);
      Array.prototype.splice.apply(cells, range);
    }
  },

  /** scroll down n lines */
  "[type('Uint16 -> Undefined')] scrollDownLine":
  function scrollDownLine(n)
  { // Scroll Up line
    var top = this._scroll_top,
        bottom = this._scroll_bottom;

    this._scrollDown(top, bottom, n);
  },

  /** scroll up n lines */
  "[type('Uint16 -> Undefined')] scrollUpLine":
  function scrollUpLine(n)
  { // Scroll Down line
    var top = this._scroll_top,
        bottom = this._scroll_bottom;

    this._scrollUp(top, bottom, n);
  },

  /** erase n characters at current line. */
  "[type('Uint16 -> Undefined')] eraseCharacters":
  function eraseCharacters(n)
  { // Erase CHaracters
    var line = this.getCurrentLine(),
        attrvalue = this._cursor.attr.value,
        start = this._cursor.positionX,
        end = start + n;

    if (end > line.length) {
      end = line.length;
    }
    line.erase(start, end, attrvalue);
  },

  /** delete n characters at current line. */
  "[type('Uint16 -> Undefined')] deleteCharacters":
  function deleteCharacters(n)
  { // Delete CHaracters
    var line = this.getCurrentLine(),
        cursor = this._cursor,
        positionX = cursor.positionX,
        attrvalue = cursor.attr.value,
        left_margin,
        right_margin;

    if (this._left_right_margin_mode) {
      // respect left-right margin
      left_margin = this._scroll_left;
      right_margin = this._scroll_right;
      if (positionX < left_margin || positionX >= right_margin) {
        // DCH has no effect outside the scrolling margins.
        return;
      }
    } else {
      right_margin = this._width;
    }

    line.deleteCells(cursor.positionX, n, attrvalue, right_margin);
  },

  isAltScreen: function isAltScreen()
  {
    return coUtils.Constant.SCREEN_ALTERNATE === this._screen_choice;
  },

// ScreenSwitchConcept implementation

  /** Switch to Alternate screen
   *
   * @implements ScreenSwitchConcept.switchToAlternateScreen
   */
  "[type('Undefined')] switchToAlternateScreen":
  function switchToAlternateScreen()
  {
    // select alternate lines.
    if (coUtils.Constant.SCREEN_MAIN === this._screen_choice) {
      this._switchScreen();
      this._screen_choice = coUtils.Constant.SCREEN_ALTERNATE;
    }
  },

  /** Switch to Main screen
   *
   * @implements ScreenSwitchConcept.switchToMainScreen
   */
  "[type('Undefined')] switchToMainScreen":
  function switchToMainScreen()
  {
    // select main lines.
    if (coUtils.Constant.SCREEN_ALTERNATE === this._screen_choice) {
      this._switchScreen();
      this._screen_choice = coUtils.Constant.SCREEN_MAIN;
    }
  },

  /** Memorize cursor state, switch to Main screen, and erase screen.
   *
   * @implements ScreenSwitchConcept.selectAlternateScreen
   *
   */
  "[type('Undefined')] selectAlternateScreen":
  function selectAlternateScreen()
  {
    if (coUtils.Constant.SCREEN_MAIN === this._screen_choice) {
      this._cursor.backup();
      this.switchToAlternateScreen();
      this.eraseScreenAll();
    }
  },

  /** Erase screen, switch to Main screen, and restore cursor.
   *
   * @implements ScreenSwitchConcept.selectMainScreen
   *
   */
  "[type('Undefined')] selectMainScreen":
  function selectMainScreen()
  {
    if (coUtils.Constant.SCREEN_ALTERNATE === this._screen_choice) {
      this.eraseScreenAll();
      this.switchToMainScreen();
      this._cursor.restore();
    }
  },

// ScreenBackupConcept Implementation

  /** Backups screen into serialize context.
   *
   * @implements ScreenBackupConcept.<command/backup>
   */
  "[subscribe('command/backup'), type('Object -> Undefined'), pnp]":
  function backup(data)
  {
    var context = [],
        lines = this._buffer,
        buffer_top = this._buffer_top,
        i,
        line;

    if (!this.backup_scrollbuffer) {
      lines = lines.slice(buffer_top);
      buffer_top = 0;
    }

    // serialize members.
    context.push(this._width, this._height, buffer_top);
    context.push(this._scroll_top, this._scroll_bottom);
    context.push(this._scroll_left, this._scroll_right);
    context.push(lines.length);

    // serialize each lines.
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      line.serialize(context);
    }

    context.push(this._screen_choice);

    // serialize cursor.
    this._cursor.serialize(context);

    // store current context
    data[this.id] = context;

  }, // backup

  /** Restores screen from serialize context.
   *
   * @implements ScreenBackupConcept.<command/restore>
   */
  "[subscribe('command/restore-fast'), type('Object -> Undefined'), pnp]":
  function restore(data)
  {
    var context = data[this.id],
        i,
        buffer_length,
        lines,
        line;

    this.width = context.shift();
    this.height = context.shift();
    this._buffer_top = context.shift();
    this._scroll_top = context.shift();
    this._scroll_bottom = context.shift();
    this._scroll_left = context.shift();
    this._scroll_right = context.shift();

    buffer_length = context.shift();

    // create screen line objects
    lines = this._buffer = this._createLines(buffer_length);

    // restore line text/attributes
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      line.deserialize(context);
    }
    //this.sendMessage("command/draw", true);

    this._screen_choice = context.shift();
    this._cursor.deserialize(context);
    this._lines = this._buffer
      .slice(this._buffer_top, this._buffer_top + this._height);

    if (coUtils.Constant.SCREEN_ALTERNATE === this._screen_choice) {
      this.switchToAlternateScreen();
    } else {
      this.switchToMainScreen();
    }
  }, // restore


// private methods
  /** Returns the line object which is on current cursor position. */
  getCurrentLine: function getCurrentLine()
  {
    return this._lines[this._cursor.positionY]
  },

  _createLines: function _createLines(n)
  {
    var buffer = [],
        width = this._width,
        line_generator = this._line_generator,
        attrvalue = this._cursor.attr.value;

    return line_generator.allocate(width, n, attrvalue);
  },

  /** Switch between Main/Alternate screens. */
  _switchScreen: function _switchScreen()
  {
    // select alternate lines.
    var buffer = this._buffer,
        width = this._width,
        height = this._height,
        offset = this._buffer_top = buffer.length - height * 2,
        lines = buffer.splice(- height),
        i;

    for (i = 0; i < lines.length; ++i) {
      lines[i].length = width;
    }

    this._lines = lines;
    Array.prototype.splice.apply(buffer, [offset, 0].concat(lines));
    this.dirty = true;
  },

  calculateHashInRectangle:
  function calculateHashInRectangle(top, left, bottom, right)
  {
    var cursor = this._cursor,
        lines = this._lines,
        length = lines.length,
        data = [],
        i,
        line,
        hash;

    for (i = top; i < bottom; ++i) {
      line = lines[i];
      line.serializeRange(data, left, right);
    }

    hash = coUtils.Algorithm.calculateMD5(data);

    function toHexString(c)
    {
      return ("0" + c.toString(16)).slice(-2);
    }

    return [toHexString(hash.charCodeAt(i)) for (i in hash)].join("").toUpperCase();
  },

  /** test */
  "[test]":
  function _test()
  {
    try {

      this.reset();
      this.softReset();

      this.CUU(1);
      this.ICH(1);
      this.CUD(1);
      this.CUF(1);
      this.CUB(1);
      this.CHA(1);
      this.CUP(1, 1);

    } finally {
    }
  },


}; // class Screen


/**
 * @fn main
 * @brief Module entry point.
 * @param {Broker} broker The Broker object.
 */
function main(broker)
{
  new Screen(broker);
}

// EOF
