import Combine
import Foundation
import WebKit

@MainActor
final class WebViewModel: ObservableObject {
    @Published var isLoading = true
    @Published var canGoBack = false
    @Published var errorMessage: String?

    let webView: WKWebView

    private(set) var homeURL: URL

    init() {
        let config = WKWebViewConfiguration()
        config.applicationNameForUserAgent = "FacilitiesChecklist/1.0"
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        config.allowsInlineMediaPlayback = true

        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = true
        config.defaultWebpagePreferences = prefs

        webView = WKWebView(frame: .zero, configuration: config)
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .automatic

        homeURL = AppConfig.webAppURL
    }

    func loadHome() {
        errorMessage = nil
        isLoading = true
        webView.load(URLRequest(url: homeURL, cachePolicy: .reloadIgnoringLocalCacheData))
    }

    func reload() {
        webView.reload()
    }

    func goBack() {
        webView.goBack()
    }

    func updateNavigationState() {
        canGoBack = webView.canGoBack
    }
}
