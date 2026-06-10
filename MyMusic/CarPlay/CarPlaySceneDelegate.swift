import CarPlay
import UIKit

class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    private var interfaceController: CPInterfaceController?

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController
        let rootTemplate = buildNowPlayingTemplate()
        interfaceController.setRootTemplate(rootTemplate, animated: false, completion: nil)
    }

    func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
    }

    // MARK: - Templates

    private func buildNowPlayingTemplate() -> CPTabBarTemplate {
        return CPTabBarTemplate(templates: [buildNowPlayingTab(), buildLibraryTab()])
    }

    private func buildNowPlayingTab() -> CPListTemplate {
        let item = CPListItem(text: "Now Playing", detailText: "My Music")
        item.handler = { [weak self] _, completion in
            self?.interfaceController?.pushTemplate(CPNowPlayingTemplate.shared, animated: true, completion: nil)
            completion()
        }
        let template = CPListTemplate(title: "Now Playing", sections: [CPListSection(items: [item])])
        template.tabImage = UIImage(systemName: "play.circle.fill")
        return template
    }

    private func buildLibraryTab() -> CPListTemplate {
        let item = CPListItem(text: "All Songs", detailText: "Your music library")
        let template = CPListTemplate(title: "Library", sections: [CPListSection(items: [item])])
        template.tabImage = UIImage(systemName: "books.vertical.fill")
        return template
    }
}
