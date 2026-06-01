import PhotosUI
import UIKit
import WebKit

final class WebViewCoordinator: NSObject {
    private weak var model: WebViewModel?
    private var fileUploadCompletion: (([URL]?) -> Void)?
    private weak var presentingViewController: UIViewController?

    init(model: WebViewModel) {
        self.model = model
    }

    func attach(to webView: WKWebView) {
        webView.navigationDelegate = self
        webView.uiDelegate = self
    }

    private func topPresenter() -> UIViewController? {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first(where: { $0.isKeyWindow })?.rootViewController
        else { return nil }
        var presenter = root
        while let next = presenter.presentedViewController {
            presenter = next
        }
        return presenter
    }

    private func finishWith(image: UIImage?) {
        let completion = fileUploadCompletion
        fileUploadCompletion = nil
        presentingViewController = nil

        guard let image, let data = image.jpegData(compressionQuality: 0.85) else {
            completion?(nil)
            return
        }
        let file = FileManager.default.temporaryDirectory
            .appendingPathComponent("upload-\(UUID().uuidString).jpg")
        do {
            try data.write(to: file, options: .atomic)
            completion?([file])
        } catch {
            completion?(nil)
        }
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
        webView.scrollView.refreshControl?.endRefreshing()
    }

    func webView(
        _ webView: WKWebView,
        didCommit navigation: WKNavigation!
    ) {
        Task { @MainActor in
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
            model?.errorMessage = "connection_failed"
        }
        webView.scrollView.refreshControl?.endRefreshing()
    }

    func webView(
        _ webView: WKWebView,
        didFailProvisionalNavigation navigation: WKNavigation!,
        withError error: Error
    ) {
        Task { @MainActor in
            model?.isLoading = false
            model?.errorMessage = "connection_failed"
        }
        webView.scrollView.refreshControl?.endRefreshing()
    }
}

extension WebViewCoordinator: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        runOpenPanelWith parameters: WKOpenPanelParameters,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping ([URL]?) -> Void
    ) {
        fileUploadCompletion = completionHandler

        guard let presenter = topPresenter() else {
            completionHandler(nil)
            return
        }
        presentingViewController = presenter

        let sheet = UIAlertController(
            title: "Add photo",
            message: nil,
            preferredStyle: .actionSheet
        )

        if UIImagePickerController.isSourceTypeAvailable(.camera) {
            sheet.addAction(UIAlertAction(title: "Take photo", style: .default) { [weak self] _ in
                self?.openCamera(from: presenter)
            })
        }

        sheet.addAction(UIAlertAction(title: "Choose from library", style: .default) { [weak self] _ in
            self?.openPhotoLibrary(from: presenter, allowsMultiple: parameters.allowsMultipleSelection)
        })

        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel) { [weak self] _ in
            self?.fileUploadCompletion?(nil)
            self?.fileUploadCompletion = nil
        })

        if let pop = sheet.popoverPresentationController {
            pop.sourceView = webView
            pop.sourceRect = CGRect(x: webView.bounds.midX, y: webView.bounds.midY, width: 1, height: 1)
        }

        presenter.present(sheet, animated: true)
    }

    private func openCamera(from presenter: UIViewController) {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = self
        picker.allowsEditing = false
        presenter.present(picker, animated: true)
    }

    private func openPhotoLibrary(from presenter: UIViewController, allowsMultiple: Bool) {
        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = .images
        config.selectionLimit = allowsMultiple ? 0 : 1

        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        presenter.present(picker, animated: true)
    }
}

extension WebViewCoordinator: UIImagePickerControllerDelegate, UINavigationControllerDelegate {
    func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
        picker.dismiss(animated: true) { [weak self] in
            self?.fileUploadCompletion?(nil)
            self?.fileUploadCompletion = nil
            self?.presentingViewController = nil
        }
    }

    func imagePickerController(
        _ picker: UIImagePickerController,
        didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
    ) {
        let image = info[.originalImage] as? UIImage
        picker.dismiss(animated: true) { [weak self] in
            self?.finishWith(image: image)
        }
    }
}

extension WebViewCoordinator: PHPickerViewControllerDelegate {
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        guard let result = results.first else {
            picker.dismiss(animated: true) { [weak self] in
                self?.fileUploadCompletion?(nil)
                self?.fileUploadCompletion = nil
                self?.presentingViewController = nil
            }
            return
        }

        picker.dismiss(animated: true) { [weak self] in
            result.itemProvider.loadObject(ofClass: UIImage.self) { object, _ in
                DispatchQueue.main.async {
                    self?.finishWith(image: object as? UIImage)
                }
            }
        }
    }
}
