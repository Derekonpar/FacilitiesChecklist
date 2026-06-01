import Foundation

enum AppConfig {
    /// Set `WEB_APP_URL` in Info.plist (from xcconfig) to your Vercel production URL.
    static var webAppURL: URL {
        guard
            let raw = Bundle.main.object(forInfoDictionaryKey: "WEB_APP_URL") as? String,
            !raw.isEmpty,
            let url = URL(string: raw)
        else {
            // Fallback for misconfiguration
            return URL(string: "https://facilities-checklist.vercel.app")!
        }
        return url
    }

    static var displayName: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String
            ?? "On Par Facilities"
    }
}
