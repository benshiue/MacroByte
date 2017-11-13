/**
 * @license
 * Visual Blocks Editor
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Loading and saving blocks with localStorage and cloud storage.
 * @author q.neutron@gmail.com (Quynh Neutron)
 */
'use strict';

// Create a namespace.
var BlocklyStorage = {};

/**
 * Backup code blocks to localStorage.
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.backupBlocks_ = function(workspace) {
  if ('localStorage' in window) {
    var xml = Blockly.Xml.workspaceToDom(workspace);
    // Gets the current URL, not including the hash.
    var url = window.location.href.split('#')[0];
    window.localStorage.setItem(url, Blockly.Xml.domToText(xml));
  }
};
/**
 *
 *
 */
BlocklyStorage.backupOnBeforeUnload = function(opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  window.addEventListener('beforeunload',function(){
    var xml = Blockly.Xml.workspaceToDom(workspace);
    var text = Blockly.Xml.domToText(xml);
    // dahai
    // 本來要在這裡等unload的時候自動上傳，可是無法啟動上傳
    // console.log(text);
    //post('/cgi-bin/storage', {xml: text});
    //setTimeout(post('/cgi-bin/storage', {xml: text}),0);
    // var myFormData = new FormData();
    // myFormData.append('xml', text);
    //
    // $.ajax({
    //   url: '/cgi-bin/storage',
    //   type: 'POST',
    //   processData: false, // important
    //   contentType: false, // important
    //   dataType : 'json',
    //   data: myFormData
    // });
    
  }, false);
}
/**
 * Bind the localStorage backup function to the unload event.
 * @param {Blockly.WorkspaceSvg=} opt_workspace Workspace.
 */
BlocklyStorage.backupOnUnload = function(opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  window.addEventListener('unload',function(){
  BlocklyStorage.backupBlocks_(workspace);
// dahai
  var xml = Blockly.Xml.workspaceToDom(workspace);
  var text = Blockly.Xml.domToText(xml);
  window.sessionStorage.loadOnceBlocks = text;
  
}, false);
};

/**
 * Restore code blocks from localStorage.
 * @param {Blockly.WorkspaceSvg=} opt_workspace Workspace.
 */
BlocklyStorage.restoreBlocks = function(opt_workspace) {
  var url = window.location.href.split('#')[0];
  if ('localStorage' in window && window.localStorage[url]) {
    var workspace = opt_workspace || Blockly.getMainWorkspace();
    var xml = Blockly.Xml.textToDom(window.localStorage[url]);
    Blockly.Xml.domToWorkspace(xml, workspace);
  }
};

/**
 *
 */
BlocklyStorage.save = function(opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  var xml = Blockly.Xml.workspaceToDom(workspace);
  var data = Blockly.Xml.domToText(xml);
  
  // check project name
  var filename = document.getElementById('projectname').value;
  if (filename == ""){
    filename = prompt("Please enter your project name", "project");
    document.getElementById('projectname').value = filename;
  }
	// upload project name to meta
	// 加這一行 handleRequest會回報name:xml status = 0 ，但是0不是http status code，可能是不能密集呼叫
	//BlocklyStorage.makeRequest_('/cgi-bin/storage', 'meta', document.getElementById('projectname').value, workspace);
	// write to local (FileSaver.js)
  console.log(filename);
  if (filename != ""){
    var blob = new Blob([data], { type: "text/plain;charset=utf-8" });
    console.log(saveAs(blob, filename + ".mbp"));
  }  
}

/**
 * Save blocks to database and return a link containing key to XML.
 * @param {Blockly.WorkspaceSvg=} opt_workspace Workspace.
 *
 * dahai: 我放了一個storage在板子上的cgi-bin，負責接收ajax request
 */
BlocklyStorage.link = function(opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  var xml = Blockly.Xml.workspaceToDom(workspace);
  var data = Blockly.Xml.domToText(xml);
	// upload xml
  BlocklyStorage.makeRequest_('/cgi-bin/roverLunar', 'xml', data, workspace);

  // dahai
  // console.log(data);
  // Code.post('/cgi-bin/storage', {xml: data});
  
};

/**
 * Retrieve XML text from database using given key.
 * @param {string} key Key to XML, obtained from href.
 * @param {Blockly.WorkspaceSvg=} opt_workspace Workspace.
 */
BlocklyStorage.retrieveXml = function(key, opt_workspace) {
  var workspace = opt_workspace || Blockly.getMainWorkspace();
  BlocklyStorage.makeRequest_('/cgi-bin/roverLunar', 'key', key, workspace);
};

/**
 * Global reference to current AJAX request.
 * @type {XMLHttpRequest}
 * @private
 */
BlocklyStorage.httpRequest_ = [null,null,null];

BlocklyStorage.xhr_i = 0;
/**
 * Fire a new AJAX request.
 * @param {string} url URL to fetch.
 * @param {string} name Name of parameter.
 * @param {string} content Content of parameter.
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.makeRequest_ = function(url, name, content, workspace) {
	console.log("makeRequest_:",BlocklyStorage.xhr_i,url,name,content);
	
	var handleRequest=function(i) {
		return function() {
		console.log("handleRequest:",i,BlocklyStorage.httpRequest_[i]);
	  if (BlocklyStorage.httpRequest_[i].readyState == 4) {
			console.log(BlocklyStorage.httpRequest_[i]);
	    // loader
	    document.getElementById("loader").style.display = "none";
	    // overlay
	    $("#overlay").hide();
	    if (BlocklyStorage.httpRequest_[i].status != 200 ) {
	      BlocklyStorage.alert(BlocklyStorage.HTTPREQUEST_ERROR + '\n' +
	          'httpRequest_.status: ' + BlocklyStorage.httpRequest_[i].status);
	    } else {
	      var data = BlocklyStorage.httpRequest_[i].responseText.trim();
	      if (BlocklyStorage.httpRequest_[i].name == 'xml') {
	        window.location.hash = data;
	        //BlocklyStorage.alert(BlocklyStorage.LINK_ALERT.replace('%1',
	        //    window.location.href));
	      } else if (BlocklyStorage.httpRequest_[i].name == 'key') {
	        if (!data.length) {
	          BlocklyStorage.alert(BlocklyStorage.HASH_ERROR.replace('%1',
	              window.location.hash));            
	        } else {
	          BlocklyStorage.loadXml_(data, BlocklyStorage.httpRequest_[i].workspace);
	        }
					BlocklyStorage.checkVersionStringForUpdateButton();
	      } else if (BlocklyStorage.httpRequest_[i].name == 'pythonCode') {
	        console.log('response of \'pythonCode\':' + data + '\n');
	      } else if (BlocklyStorage.httpRequest_[i].name == 'action') {
	        //output(data + '\n');
	        console.log('response of \'action\':' + data + '\n');
	        // if resurn is version
	        var obj = jQuery.parseJSON (data);
	        //console.log(obj);
	        if(typeof obj.board_version != "undefined") {
	          //output(obj.version + '\n');
	          document.getElementById('boardVersion').value = obj.board_version;
						document.getElementById("version_string").innerHTML = 'v' + obj.board_version;
	        }
	        if(typeof obj.now_version != "undefined") {
	          //output(obj.version + '\n');
	          document.getElementById('currentVersion').value = obj.now_version;
	        }
					BlocklyStorage.checkVersionStringForUpdateButton();
				
	        if(typeof obj.software_update != "undefined") {
	          if (obj.software_update == "1"){
	          	console.log('update finish.');
							window.setTimeout(function(){document.getElementById('check_version').click()}, 2000);
						
	          }
	        }
	      }
	      BlocklyStorage.monitorChanges_(BlocklyStorage.httpRequest_[i].workspace);
	    }
	    BlocklyStorage.httpRequest_[i] = null;
		  }
	  }
  }
	
	
	
  //if (BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i]) {
  //  // AJAX call is in-flight.
  //  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].abort();
  //}
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i] = new XMLHttpRequest();
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].name = name;
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].open('POST', url);
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].setRequestHeader('Content-Type','application/x-www-form-urlencoded');
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].workspace = workspace;
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].send(name + '=' + encodeURIComponent(content));
  BlocklyStorage.httpRequest_[BlocklyStorage.xhr_i].onreadystatechange = handleRequest(BlocklyStorage.xhr_i);
	
	
  // loader
  document.getElementById("loader").style.display = "block";
  // overlay
  $("#overlay").show();

	BlocklyStorage.xhr_i = BlocklyStorage.xhr_i + 1;
	
	
};

/**
 *
 */
BlocklyStorage.checkVersionStringForUpdateButton = function() {
	var board_version = document.getElementById('boardVersion').value;
	var current_version = document.getElementById('currentVersion').value;
	console.log('board_version=' + board_version);
	console.log('current_version=' + current_version);
	if (typeof board_version != "undefined" && typeof current_version != "undefined" && board_version != "" && current_version != ""){
		console.log('update button enable');
		document.getElementById('software_update').disabled = false;
	}else{
		console.log('update button disable');
		document.getElementById('software_update').disabled = true;
	}
}
/**
 * Callback function for AJAX call.
 * @private
 */
/*
BlocklyStorage.handleRequest_ = function(i) {
	console.log(i,BlocklyStorage.httpRequest_[i]);
  if (BlocklyStorage.httpRequest_[i].readyState == 4) {
		console.log(BlocklyStorage.httpRequest_[i]);
    // loader
    document.getElementById("loader").style.display = "none";
    // overlay
    $("#overlay").hide();
    if (BlocklyStorage.httpRequest_[i].status != 200 ) {
      BlocklyStorage.alert(BlocklyStorage.HTTPREQUEST_ERROR + '\n' +
          'httpRequest_.status: ' + BlocklyStorage.httpRequest_[i].status);
    } else {
      var data = BlocklyStorage.httpRequest_[i].responseText.trim();
      if (BlocklyStorage.httpRequest_[i].name == 'xml') {
        window.location.hash = data;
        //BlocklyStorage.alert(BlocklyStorage.LINK_ALERT.replace('%1',
        //    window.location.href));
      } else if (BlocklyStorage.httpRequest_[i].name == 'key') {
        if (!data.length) {
          BlocklyStorage.alert(BlocklyStorage.HASH_ERROR.replace('%1',
              window.location.hash));            
        } else {
          BlocklyStorage.loadXml_(data, BlocklyStorage.httpRequest_[i].workspace);
        }
				BlocklyStorage.checkVersionStringForUpdateButton();
      } else if (BlocklyStorage.httpRequest_[i].name == 'pythonCode') {
        console.log('response of \'pythonCode\':' + data + '\n');
      } else if (BlocklyStorage.httpRequest_[i].name == 'action') {
        //output(data + '\n');
        console.log('response of \'action\':' + data + '\n');
        // if resurn is version
        var obj = jQuery.parseJSON (data);
        //console.log(obj);
        if(typeof obj.board_version != "undefined") {
          //output(obj.version + '\n');
          document.getElementById('boardVersion').value = obj.board_version;
					document.getElementById("version_string").innerHTML = 'v' + obj.board_version;
        }
        if(typeof obj.now_version != "undefined") {
          //output(obj.version + '\n');
          document.getElementById('currentVersion').value = obj.now_version;
        }
				BlocklyStorage.checkVersionStringForUpdateButton();
				
        if(typeof obj.software_update != "undefined") {
          if (obj.software_update == "1"){
          	console.log('update finish.');
						window.setTimeout(function(){document.getElementById('check_version').click()}, 2000);
						
          }
        }
      }
      BlocklyStorage.monitorChanges_(BlocklyStorage.httpRequest_[i].workspace);
    }
    BlocklyStorage.httpRequest_[i] = null;
	}
};
*/
/**
 * Start monitoring the workspace.  If a change is made that changes the XML,
 * clear the key from the URL.  Stop monitoring the workspace once such a
 * change is detected.
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.monitorChanges_ = function(workspace) {
  var startXmlDom = Blockly.Xml.workspaceToDom(workspace);
  var startXmlText = Blockly.Xml.domToText(startXmlDom);
  function change() {
    var xmlDom = Blockly.Xml.workspaceToDom(workspace);
    var xmlText = Blockly.Xml.domToText(xmlDom);
    if (startXmlText != xmlText) {
      console.log("change() is happening");
      window.location.hash = '';
      workspace.removeChangeListener(bindData);
    }
  }
  var bindData = workspace.addChangeListener(change);
};

/**
 * Load blocks from XML.
 * @param {string} xml Text representation of XML.
 * @param {!Blockly.WorkspaceSvg} workspace Workspace.
 * @private
 */
BlocklyStorage.loadXml_ = function(xml, workspace) {
  try {
    xml = Blockly.Xml.textToDom(xml);
  } catch (e) {
    BlocklyStorage.alert(BlocklyStorage.XML_ERROR + '\nXML: ' + xml);
    return;
  }
  // Clear the workspace to avoid merge.
  workspace.clear();
  Blockly.Xml.domToWorkspace(xml, workspace);
};

/**
 * Present a text message to the user.
 * Designed to be overridden if an app has custom dialogs, or a butter bar.
 * @param {string} message Text to alert.
 */
BlocklyStorage.alert = function(message) {
  window.alert(message);
};
