import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKScriptMessageHandler {
    private let heliusApiKeyPreference = "heliusApiKey"
    private let openAiApiKeyPreference = "openAiApiKey"
    private var window: NSWindow?
    private weak var webView: WKWebView?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)

        let configuration = WKWebViewConfiguration()
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "tradeReviewerLog")
        userContentController.add(self, name: "tradeReviewerStorage")
        userContentController.add(self, name: "tradeReviewerOpenAI")
        userContentController.addUserScript(WKUserScript(
            source: startupScript(),
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        configuration.userContentController = userContentController

        let webView = WKWebView(frame: .zero, configuration: configuration)
        self.webView = webView
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
            let key = payload["key"] as? String
            UserDefaults.standard.set(value, forKey: key == "openai" ? openAiApiKeyPreference : heliusApiKeyPreference)
            return
        }

        if message.name == "tradeReviewerOpenAI",
           let payload = message.body as? [String: Any],
           let requestId = payload["id"] as? String,
           let requestPayload = payload["payload"] as? [String: Any] {
            sendOpenAIRequest(id: requestId, payload: requestPayload)
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
        let heliusApiKey = UserDefaults.standard.string(forKey: heliusApiKeyPreference) ?? ""
        let openAiApiKey = UserDefaults.standard.string(forKey: openAiApiKeyPreference) ?? ""
        return """
        window.__TRADE_REVIEWER_API_KEY__ = \(jsonString(heliusApiKey));
        window.__TRADE_REVIEWER_OPENAI_API_KEY__ = \(jsonString(openAiApiKey));
        window.__TRADE_REVIEWER_OPENAI_CALLBACKS__ = {};
        window.__TRADE_REVIEWER_OPENAI_REQUEST__ = function(payload) {
          return new Promise(function(resolve, reject) {
            var id = (window.crypto && window.crypto.randomUUID) ? window.crypto.randomUUID() : String(Date.now()) + Math.random();
            window.__TRADE_REVIEWER_OPENAI_CALLBACKS__[id] = { resolve: resolve, reject: reject };
            window.webkit.messageHandlers.tradeReviewerOpenAI.postMessage({ id: id, payload: payload });
          });
        };
        window.__TRADE_REVIEWER_OPENAI_RESOLVE__ = function(id, result) {
          var callback = window.__TRADE_REVIEWER_OPENAI_CALLBACKS__[id];
          if (!callback) return;
          delete window.__TRADE_REVIEWER_OPENAI_CALLBACKS__[id];
          if (result && result.error) {
            callback.reject(new Error(result.error));
          } else {
            callback.resolve(result);
          }
        };
        window.onerror = function(message, source, line, column, error) {
          window.webkit.messageHandlers.tradeReviewerLog.postMessage('JS error: ' + message + ' at ' + line + ':' + column);
        };
        window.addEventListener('unhandledrejection', function(event) {
          window.webkit.messageHandlers.tradeReviewerLog.postMessage('Unhandled rejection: ' + event.reason);
        });
        """
    }

    private func sendOpenAIRequest(id: String, payload: [String: Any]) {
        let apiKey = UserDefaults.standard.string(forKey: openAiApiKeyPreference) ?? ""
        guard !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            resolveOpenAIRequest(id: id, result: ["error": "Add an OpenAI API key before running the AI coach."])
            return
        }

        guard JSONSerialization.isValidJSONObject(payload),
              let body = try? JSONSerialization.data(withJSONObject: payload) else {
            resolveOpenAIRequest(id: id, result: ["error": "The OpenAI request payload was invalid."])
            return
        }

        var request = URLRequest(url: URL(string: "https://api.openai.com/v1/responses")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey.trimmingCharacters(in: .whitespacesAndNewlines))", forHTTPHeaderField: "Authorization")
        request.httpBody = body

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error {
                self.resolveOpenAIRequest(id: id, result: ["error": error.localizedDescription])
                return
            }

            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            guard let data else {
                self.resolveOpenAIRequest(id: id, result: ["error": "OpenAI returned an empty response."])
                return
            }

            let parsed = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            if !(200...299).contains(statusCode) {
                self.resolveOpenAIRequest(id: id, result: ["error": self.openAIErrorMessage(parsed, statusCode: statusCode)])
                return
            }

            self.resolveOpenAIRequest(id: id, result: parsed ?? ["error": "OpenAI returned an unreadable response."])
        }.resume()
    }

    private func resolveOpenAIRequest(id: String, result: [String: Any]) {
        DispatchQueue.main.async {
            guard JSONSerialization.isValidJSONObject(result),
                  let data = try? JSONSerialization.data(withJSONObject: result),
                  let json = String(data: data, encoding: .utf8) else {
                return
            }

            self.webView?.evaluateJavaScript("window.__TRADE_REVIEWER_OPENAI_RESOLVE__(\(self.jsonString(id)), \(json));")
        }
    }

    private func openAIErrorMessage(_ payload: [String: Any]?, statusCode: Int) -> String {
        if let error = payload?["error"] as? [String: Any],
           let message = error["message"] as? String {
            return message
        }

        return "OpenAI request failed with status \(statusCode)."
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
