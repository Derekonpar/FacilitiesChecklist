import SwiftUI
import WebKit

struct ContentView: View {
    @StateObject private var model = WebViewModel()
    @State private var coordinator: WebViewCoordinator?

    var body: some View {
        ZStack {
            WebViewRepresentable(model: model, coordinator: $coordinator)
                .ignoresSafeArea(edges: .bottom)

            if model.isLoading {
                ProgressView()
                    .scaleEffect(1.1)
                    .padding(20)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
            }

            if let error = model.errorMessage {
                VStack(spacing: 12) {
                    Text("Can't load app")
                        .font(.headline)
                    Text(error)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                    Button("Retry") {
                        model.loadHome()
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(24)
                .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
                .padding()
            }
        }
        .safeAreaInset(edge: .top, spacing: 0) {
            topBar
        }
        .onAppear {
            if coordinator == nil {
                let c = WebViewCoordinator(model: model)
                coordinator = c
                c.attach(to: model.webView)
            }
            model.loadHome()
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            Button {
                model.goBack()
            } label: {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
            }
            .disabled(!model.canGoBack)
            .opacity(model.canGoBack ? 1 : 0.35)

            VStack(alignment: .leading, spacing: 0) {
                Text(AppConfig.displayName)
                    .font(.subheadline.weight(.semibold))
                Text(model.homeURL.host ?? "")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Button {
                model.reload()
            } label: {
                Image(systemName: "arrow.clockwise")
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(.bar)
    }
}

private struct WebViewRepresentable: UIViewRepresentable {
    @ObservedObject var model: WebViewModel
    @Binding var coordinator: WebViewCoordinator?

    func makeUIView(context: Context) -> WKWebView {
        model.webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

#Preview {
    ContentView()
}
