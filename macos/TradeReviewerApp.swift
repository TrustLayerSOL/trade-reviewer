import AppKit
import WebKit

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var window: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)

        let webView = WKWebView(frame: .zero)
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

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        true
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
