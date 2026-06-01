import PhotosUI
import UIKit
import WebKit

final class WebViewCoordinator: NSObject {
    private weak var model: WebViewModel?
    private var fileUploadCompletion: (([URL]?) -> Void)?

    init(model: WebViewModel) {
        self.model = model
    }

    func attach(to webView: WKWebView) {
        webView.navigationDelegate = self
        webView.uiDelegate = self
    }
}

extension WebViewCoordinator: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        Task { @MainActor in
            model?.isLoading = true
            model?.errorMessage = nil
        }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        Task { @MainActor in
            model?.isLoading = false
            model?.updateNavigationState()
        }
    }

    func webView(
        _ webView: WKWebView,
        didFail navigation: WKNavigation!,
        withError error: Error
    ) {
        Task { @MainActor in
            model?.isLoading = false
            model?.errorMessage = error.localizedDescription
        }
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        Task { @MainActor in
            model?.isLoading = false
            model?.errorMessage = error.localizedDescription
        }
    }
}

extension WebViewCoordinator: WKUIDelegate {
    /// Allow `<input type="file">` photo capture on the submit form.
    func webView(
        _ webView: WKWebView,
        runOpenPanelWith parameters: WKOpenPanelParameters,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        fileUploadCompletion = completionHandler

        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = .images
        config.selectionLimit = parameters.allowsMultipleSelection ? 0 : 1

        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self

        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        else {
            completionHandler(nil)
            return
        }
        var presenter = root
        while let next = presenter.presentedViewController {
            presenter = next
        }
        presenter.present(picker, animated: true)
    }
}

extension WebViewCoordinator: PHPickerViewControllerDelegate {
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)

        guard !results.isEmpty else {
            fileUploadCompletion?(nil)
            fileUploadCompletion = nil
            return
        }

        let group = DispatchGroup()
        var urls: [URL] = []
        let tmp = FileManager.default.temporaryDirectory

        for (index, result) in results.enumerated() {
            group.enter()
            result.itemProvider.loadObject(ofClass: UIImage.self) { object, _ in
                defer { group.leave() }
                guard let image = object as? UIImage,
                      let data = image.jpegData(compressionQuality: 0.85)
                else { return }
                let file = tmp.appendingPathComponent("upload-\(index)-\(UUID().uuidString).jpg")
                try? data.write(to: file)
                urls.append(file)
            }
        }

        group.notify(queue: .main) { [weak self] in
            self?.fileUploadCompletion?(urls.isEmpty ? nil : urls)
            self?.fileUploadCompletion = nil
        }
    }
}
