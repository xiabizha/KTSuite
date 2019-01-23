var chosenEntry = null;
var chooseFileButton = document.querySelector('#choose_file');
var buffer = document.querySelector('#buffer');
var downloadButton = document.querySelector('#download');
var stopButton = document.querySelector('#stop');
var resetButton = document.querySelector('#reset');
var filecontent = "";
var script_length;

function stringToUint8Array(str){
  var arr = [];
  for (var i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }
 
  var tmpUint8Array = new Uint8Array(arr);
  return tmpUint8Array
}
    
function errorHandler(e) {
  console.error(e);
}

function displayEntryData(theEntry) {
  if (theEntry.isFile) {
    chrome.fileSystem.getDisplayPath(theEntry, function(path) {
      document.querySelector('#file_path').value = path;
    });
    theEntry.getMetadata(function(data) {
      document.querySelector('#file_size').textContent = data.size;
      script_length = data.size;
    });    
  }
  else {
    document.querySelector('#file_path').value = theEntry.fullPath;
    document.querySelector('#file_size').textContent = "N/A";
  }
}

function readAsText(fileEntry, callback) {
  fileEntry.file(function(file) {
    var reader = new FileReader();

    reader.onerror = errorHandler;
    reader.onload = function(e) {
      callback(e.target.result);
    };

    reader.readAsText(file);
  });
}

// for files, read the text content into the textarea
function loadFileEntry(_chosenEntry) {
  chosenEntry = _chosenEntry;
  chosenEntry.file(function(file) {
    readAsText(chosenEntry, function(result) {
      //textarea.value = result;
		  filecontent += result;
    });
    // Update display.
    displayEntryData(chosenEntry);
  });
}

chooseFileButton.addEventListener('click', function(e) {
  var accepts = [{
    mimeTypes: ['text/*'],
    extensions: ['js', 'css', 'txt', 'html', 'xml', 'tsv', 'csv', 'rtf']
  }];
  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(theEntry) {
    if (!theEntry) {
      output.textContent = 'No file selected.';
      return;
    }
    // use local storage to retain access to this file
    chrome.storage.local.set({'chosenFile': chrome.fileSystem.retainEntry(theEntry)});
    loadFileEntry(theEntry);
  });
});

stopButton.addEventListener('click', function() {
	log("Stop script");
  var stop_script = new Uint8Array(6);
  stop_script[0] = 0x30;
  stop_script[1] = 0x06;
  stop_script[2] = 0;
  stop_script[3] = 0;
  stop_script[4] = 0;
  stop_script[5] = 0;
  connection.sendbyteArray(stop_script);
});

downloadButton.addEventListener('click', function() {
  var dwload_script = new Uint8Array(6);
  dwload_script[0] = 0x30;
  dwload_script[1] = 0x0e;
  dwload_script[2] = (script_length &(0x00FF));
  dwload_script[3] = (script_length &(0xFF00)) >> 8;
  dwload_script[4] = 0;
  dwload_script[5] = 0;
  connection.sendbyteArray(dwload_script);
  
	log("Download data:" + filecontent);
  connection.send(filecontent);
});

resetButton.addEventListener('click', function() {
	log("reset KT board");
  var reset_board = new Uint8Array(6);
  reset_board[0] = 0x30;
  reset_board[1] = 0x0c;
  reset_board[2] = 0;
  reset_board[3] = 0;
  reset_board[4] = 0;
  reset_board[5] = 0;
  connection.sendbyteArray(reset_board);
});