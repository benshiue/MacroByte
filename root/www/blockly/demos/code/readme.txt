筆記
在server端有兩個cgi分別是runPython以及storage
而他們的call graph如下：

程式碼上傳使用隱藏表格的POST上傳方法 這個方法不必對程式文字內容編碼
-------- code.js ----------------- 
code.uploadScript() -> code.post() ... cgi-bin/runPython

原生blockly上傳機制使用 XMLHttpRequest POST方法 傳輸內容需要編碼 經測試後不適用在程式碼上傳
link()裡面用到saveAS()做本地儲存
---- code.js ----            ------------------------ storage.js -------------------------
init()(bindClick())    ---> BlocklyStorage.link()        ----> BlocklyStorage.makeRequest_() ... cgi-bin/storage ... handleRequest_() ---> monitorChanges_()
uploadScript() _________/                                  /                                                            \_loadXml_()
loadBlocks()   ----------> BlocklyStorage.retrieveXml() __/
                                                         /
strtStream()   -----------------------------------------
stopStream()   ----------------------------------------/
runProgram()   ---------------------------------------/
stopProgram()  --------------------------------------/

                             BlocklyStorage.save() ---> saveAs()
              
載入本地程式碼
folderButton ---> importBlock() ....> handleFileSelect() ....> reader.onloadend() ---> monitorChanges_()
                                                                   \_loadXml_()
在handleRequest_()裡面
httpRequest_.name == 'xml' 代表xml資料上傳
httpRequest_.name == 'key' 代表xml資料下載

2017-10-11
原本BlocklyStorage.link()是用來上傳xml，但我把本地存檔也放在這裡
今天把本地存檔API獨立出來： BlocklyStorage.save()

2017-10-25
Blockly數值欄位沒有支援0x語法
今天修改blockly原始碼，加入「數字資料允許hex字串」
python碼 數值的產生方式
call graph如下 
generator.js -> valueToCode -> blockToCode ...> python/math.js -> Blockly.Python['math_number'] = function(block)
                                                                                                  ^___ 在這裡加入HEX字串判斷
加入I2C讀寫積木																																																	
加入參數欄位可擴展積木 "create parameter with" 修改自 "create list with
避免終端機訊息太多拖垮網頁瀏覽器
增加arduino資料夾擺放32u4端的firmata程式
增加gyro積木                                                                                                 