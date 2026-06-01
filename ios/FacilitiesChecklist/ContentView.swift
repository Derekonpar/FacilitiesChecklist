import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var model = WebViewModel()
    @State private var coordinator: WebViewCoordinator?
    @State private var didLoadInitially = false

    var body: some View {
        ZStack {
            WebViewRepresentable(
                model: model,
                coordinator: $coordinator,
                onRefresh: { model.reload() },
            )
            .ignoresSafeArea()

            if model.isLoading && model.errorMessage == nil {
                VStack {
                    ProgressView()
                        .scaleEffect(1.1)
                        .padding(20)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
                    Spacer()
                }
                .padding(.top, 60)
                .allowsHitTesting(false)
            }

            if model.errorMessage != nil {
                VStack(spacing: 12) {
                    Text("Unable to connect")
                        .font(.headline)
                    Text("Check your internet connection and try again.")
                        .font(.subheadline)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                    Button("Try again") {
                        model.loadHome()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(24)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                .padding()
            }
        }
        .onAppear {
            if coordinator == nil {
                let c = WebViewCoordinator(model: model)
                coordinator = c
                c.attach(to: model.webView)
            }
            // Only load home on first launch — returning from camera re-triggers
            // onAppear and must not navigate away from the current page.
            if !didLoadInitially {
                didLoadInitially = true
                model.loadHome()
            }
        }
    }
}

private struct WebViewRepresentable: UIViewRepresentable {
    @ObservedObject var model: WebViewModel
    @Binding var coordinator: WebViewCoordinator?
    var onRefresh: () -> Void

    func makeCoordinator() -> RefreshHandler {
        RefreshHandler(onRefresh: onRefresh)
    }

    func makeUIView(context: Context) -> WKWebView {
        let webView = model.webView
        let refresh = UIRefreshControl()
        refresh.addTarget(
            context.coordinator,
            action: #selector(RefreshHandler.didPullToRefresh),
            for: .valueChanged,
        )
        webView.scrollView.refreshControl = refresh
        context.coordinator.refreshControl = refresh
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        context.coordinator.onRefresh = onRefresh
        if !model.isLoading {
            context.coordinator.refreshControl?.endRefreshing()
        }
    }

    final class RefreshHandler: NSObject {
        var refreshControl: UIRefreshControl?
        var onRefresh: () -> Void

        init(onRefresh: @escaping () -> Void) {
            self.onRefresh = onRefresh
        }

        @objc func didPullToRefresh() {
            onRefresh()
        }
    }
}

#Preview {
    ContentView()
}
