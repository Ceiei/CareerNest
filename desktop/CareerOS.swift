import AppKit
@preconcurrency import WebKit

final class CareerApp: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var window: NSWindow!
    var web: WKWebView!
    var service: Process?
    var attempts = 0
    var logHandle: FileHandle?
    let origin = "http://127.0.0.1:43119"
    var dataURL: URL {
        if let override = ProcessInfo.processInfo.environment["CAREER_OS_DATA"] { return URL(fileURLWithPath: override) }
        return FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("Career OS")
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        if let other = NSRunningApplication.runningApplications(withBundleIdentifier: Bundle.main.bundleIdentifier ?? "local.career-os.desktop").first(where: {$0.processIdentifier != ProcessInfo.processInfo.processIdentifier}) {
            other.activate(options: [.activateAllWindows, .activateIgnoringOtherApps]); NSApp.terminate(nil); return
        }
        let menu=NSMenu(); let item=NSMenuItem(); menu.addItem(item); let appMenu=NSMenu(); item.submenu=appMenu
        appMenu.addItem(withTitle:"关于 Career OS",action:#selector(NSApplication.orderFrontStandardAboutPanel(_:)),keyEquivalent:"")
        appMenu.addItem(NSMenuItem.separator()); appMenu.addItem(withTitle:"退出 Career OS",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q")
        let edit=NSMenuItem();menu.addItem(edit);let editMenu=NSMenu(title:"编辑");edit.submenu=editMenu
        for (title,action,key) in [("撤销","undo:","z"),("剪切","cut:","x"),("复制","copy:","c"),("粘贴","paste:","v"),("全选","selectAll:","a")] { editMenu.addItem(withTitle:title,action:Selector(action),keyEquivalent:key) }
        NSApp.mainMenu=menu
        window=NSWindow(contentRect:NSRect(x:0,y:0,width:1280,height:840),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false)
        window.title=ProcessInfo.processInfo.environment["CAREER_OS_DATA"] == nil ? "Career OS" : "Career OS · 开发验证";window.minSize=NSSize(width:900,height:650);window.center();window.isReleasedWhenClosed=false
        let loading=NSTextField(labelWithString:"正在打开你的资料库…");loading.alignment = .center; loading.font=NSFont.systemFont(ofSize:20);loading.frame=NSRect(x:40,y:360,width:1200,height:50);window.contentView?.addSubview(loading)
        window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)
        do {
            try FileManager.default.createDirectory(at:dataURL,withIntermediateDirectories:true,attributes:[.posixPermissions:0o700])
            let log=dataURL.appendingPathComponent("desktop.log");if !FileManager.default.fileExists(atPath:log.path){FileManager.default.createFile(atPath:log.path,contents:nil,attributes:[.posixPermissions:0o600])}
            logHandle=try FileHandle(forWritingTo:log);try logHandle?.seekToEnd()
            let process=Process();process.executableURL=Bundle.main.resourceURL!.appendingPathComponent("server/career-service")
            var environment=ProcessInfo.processInfo.environment;environment["CAREER_OS_DATA"]=dataURL.path;environment["CAREER_OS_PARENT_PID"]=String(ProcessInfo.processInfo.processIdentifier);environment["PATH"]="/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin";process.environment=environment
            process.standardOutput=logHandle;process.standardError=logHandle;try process.run();service=process
            pollService()
        } catch { fail("无法启动本地资料库：\(error.localizedDescription)") }
    }

    func pollService() {
        attempts += 1
        var request=URLRequest(url:URL(string:origin+"/health")!);request.timeoutInterval=1
        URLSession.shared.dataTask(with:request){data,_,_ in
            DispatchQueue.main.async {
                if let data=data, let info=try? JSONSerialization.jsonObject(with:data) as? [String:Any], (info["api_version"] as? Int)==2,
                   let token=try? String(contentsOf:self.dataURL.appendingPathComponent("config/api-token.txt"),encoding:.utf8), !token.isEmpty {
                    if self.service?.isRunning == true { self.showWorkspace(token:token.trimmingCharacters(in:.whitespacesAndNewlines)); return }
                }
                if self.attempts>=80 || self.service?.isRunning == false {self.fail("资料库未能启动。可能仍有旧版本地服务占用端口；请退出旧服务后重新打开应用。详情在应用数据目录的 desktop.log。");return}
                DispatchQueue.main.asyncAfter(deadline:.now()+0.25){self.pollService()}
            }
        }.resume()
    }

    func showWorkspace(token:String) {
        let config=WKWebViewConfiguration();config.websiteDataStore = .default()
        let bootstrap:[String:Any]=["token":token,"dataDirectory":dataURL.path]
        let json=String(data:try! JSONSerialization.data(withJSONObject:bootstrap),encoding:.utf8)!
        let script="if(location.origin === '\(origin)'){Object.defineProperty(window,'careerDesktop',{value:Object.freeze(\(json)),writable:false});}"
        config.userContentController.addUserScript(WKUserScript(source:script,injectionTime:.atDocumentStart,forMainFrameOnly:true))
        config.userContentController.add(self,name:"careerDesktop")
        web=WKWebView(frame:window.contentView!.bounds,configuration:config);web.autoresizingMask=[.width,.height];web.navigationDelegate=self;web.uiDelegate=self
        window.contentView=web
        var request=URLRequest(url:URL(string:origin+"/desktop")!);request.setValue(token,forHTTPHeaderField:"X-Career-Token")
        web.load(request)
    }

    func fail(_ message:String){let alert=NSAlert();alert.messageText="Career OS 无法打开";alert.informativeText=message;alert.runModal();NSApp.terminate(nil)}
    func applicationShouldTerminateAfterLastWindowClosed(_ sender:NSApplication)->Bool{true}
    func applicationSupportsSecureRestorableState(_ app:NSApplication)->Bool{true}
    func applicationShouldTerminate(_ sender:NSApplication)->NSApplication.TerminateReply{
        guard let web=web else{return .terminateNow}
        web.evaluateJavaScript("Boolean(window.careerHasUnsavedChanges && window.careerHasUnsavedChanges())"){value,_ in
            var shouldQuit=true
            if value as? Bool == true{let alert=NSAlert();alert.messageText="还有未保存的修改";alert.informativeText="退出会丢弃当前编辑，已保存资料不受影响。";alert.addButton(withTitle:"继续编辑");alert.addButton(withTitle:"丢弃并退出");shouldQuit=alert.runModal() == .alertSecondButtonReturn}
            if !shouldQuit{self.window.makeKeyAndOrderFront(nil)}
            sender.reply(toApplicationShouldTerminate:shouldQuit)
        };return .terminateLater
    }
    func applicationWillTerminate(_ notification:Notification){if service?.isRunning == true{service?.terminate()};try? logHandle?.close()}

    func isLocal(_ url:URL?)->Bool { guard let url=url else{return false};return url.scheme=="http" && url.host=="127.0.0.1" && url.port==43119 }
    func webView(_ webView:WKWebView,decidePolicyFor navigationAction:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){
        let url=navigationAction.request.url
        if isLocal(url) || url?.scheme=="blob" || url?.absoluteString=="about:blank" {decisionHandler(.allow);return}
        if let url=url,["https","http"].contains(url.scheme ?? ""),navigationAction.navigationType == .linkActivated {NSWorkspace.shared.open(url)}
        decisionHandler(.cancel)
    }
    func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for navigationAction:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView?{
        if let url=navigationAction.request.url,["https","http"].contains(url.scheme ?? ""),!isLocal(url){NSWorkspace.shared.open(url)};return nil
    }
    func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error){if (error as NSError).code != NSURLErrorCancelled{fail(error.localizedDescription)}}
    func webView(_ webView:WKWebView,runJavaScriptAlertPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping()->Void){let a=NSAlert();a.messageText=message;a.runModal();completionHandler()}
    func webView(_ webView:WKWebView,runJavaScriptConfirmPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping(Bool)->Void){let a=NSAlert();a.messageText=message;a.addButton(withTitle:"继续");a.addButton(withTitle:"取消");completionHandler(a.runModal() == .alertFirstButtonReturn)}
    func webView(_ webView:WKWebView,runOpenPanelWith parameters:WKOpenPanelParameters,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping([URL]?)->Void){let panel=NSOpenPanel();panel.canChooseDirectories=false;panel.allowsMultipleSelection=parameters.allowsMultipleSelection;completionHandler(panel.runModal() == .OK ? panel.urls:nil)}
    func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage){
        guard message.frameInfo.isMainFrame,isLocal(message.frameInfo.request.url),let body=message.body as? [String:String],let action=body["action"] else{return}
        if action=="folder" {NSWorkspace.shared.open(dataURL)}
        if action=="ready"{try? logHandle?.write(contentsOf:Data("Workspace ready\n".utf8))}
        if action=="error",let name=body["name"]{try? logHandle?.write(contentsOf:Data(("Workspace error: "+name.prefix(180)+"\n").utf8))}
        if action=="copy",let text=body["text"],text.count==8,text.allSatisfy({$0.isNumber}){NSPasteboard.general.clearContents();NSPasteboard.general.setString(text,forType:.string)}
        if action=="save",let encoded=body["data"],encoded.count<80_000_000,let data=Data(base64Encoded:encoded){
            let panel=NSSavePanel();panel.nameFieldStringValue=URL(fileURLWithPath:body["name"] ?? "career-export.json").lastPathComponent
            if panel.runModal() == .OK,let url=panel.url {do{try data.write(to:url,options:.atomic)}catch{let alert=NSAlert();alert.messageText="保存失败";alert.informativeText=error.localizedDescription;alert.runModal()}}
        }
    }
}
let app=NSApplication.shared
let delegate=CareerApp();app.delegate=delegate;app.setActivationPolicy(.regular);app.run()
