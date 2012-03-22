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
 * @Attribute SequenceAttribute
 *
 */
let SequenceAttribute = new Attribute("sequence");
SequenceAttribute.definition = {

  get __id()
    "sequence",

  get __info()
    <Attribute>
      <name>{_("Sequence")}</name>
      <description>{
        _("Marks a function as a sequence handler.")
      }</description>
      <detail>
      <![CDATA[
        "sequence" attribute marks a function as sequence handler.

        usage:

          "[sequence('CSI ?%dh')]":
          function DECSET(n) 
          { 
            ....
          },

      ]]>
      </detail>
    </Attribute>,



  /** constructor 
   *  @param {EventBroker} broker Parent broker object.
   */
  initialize: function initialize(broker)
  {
    let attributes = this.__attributes;
    for (let key in attributes) {
      let expressions = attributes[key]["sequence"];
      if (expressions) {
        let handler = this[key];
        expressions.forEach(
          function(expression) 
          {
            broker.subscribe(
              "get/sequences", 
              function getSequences() 
              {
                return {
                  expression: expression,
                  handler: handler,
                  context: this,
                };
              }, this);
          }, this);
      }
    }
  },

};

/**
 * @fn main
 * @brief Module entry point
 * @param {target_class} target_class The Class object.
 */
function main(target_class)
{
  target_class.mix(SequenceAttribute);
}



