import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    private let apiKeyPreference = "heliusApiKey"
    private var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)

        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "tradeReviewerLog")
        userContentController.add(self, name: "tradeReviewerStorage")
        userContentController.addUserScript(WKUserScript(
            source: startupScript(),
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        configuration.userContentController = userContentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = self
        webView.setValue(false, forKey: "drawsBackground")

        guard let indexURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "dist"),
              let distURL = Bundle.main.resourceURL?.appendingPathComponent("dist", isDirectory: true) else {
            showError("The bundled Trade Reviewer files are missing.")
            return
        }

        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 1240, height: 820),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.title = "Trade Reviewer"
        window.center()
        window.contentView = webView
        window.makeKeyAndOrderFront(nil)
        self.window = window

        webView.loadFileURL(indexURL, allowingReadAccessTo: distURL)
        NSApp.activate(ignoringOtherApps: true)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "tradeReviewerStorage",
           let payload = message.body as? [String: Any],
           payload["type"] as? String == "saveApiKey",
           let value = payload["value"] as? String {
            UserDefaults.standard.set(value, forKey: apiKeyPreference)
            return
        }

        if message.name == "tradeReviewerLog" {
            NSLog("TradeReviewer web: \(message.body)")
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
    }

    private func startupScript() -> String {
        let apiKey = UserDefaults.standard.string(forKey: apiKeyPreference) ?? ""
        return """
        window.__TRADE_REVIEWER_API_KEY__ = \(jsonString(apiKey));
        window.onerror = function(message, source, line, column, error) {
          window.webkit.messageHandlers.tradeReviewerLog.postMessage('JS error: ' + message + ' at ' + line + ':' + column);
        };
        window.addEventListener('unhandledrejection', function(event) {
          window.webkit.messageHandlers.tradeReviewerLog.postMessage('Unhandled rejection: ' + event.reason);
        });
        """
    }

    private func jsonString(_ value: String) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: [value]),
              let json = String(data: data, encoding: .utf8),
              json.count >= 2 else {
            return "\"\""
        }

        return String(json.dropFirst().dropLast())
    }

    private func showError(_ message: String) {
        let alert = NSAlert()
        alert.messageText = "Trade Reviewer could not open"
        alert.informativeText = message
        alert.alertStyle = .critical
        alert.runModal()
        NSApp.terminate(nil)
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
