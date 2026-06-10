import Foundation
import Observation

@Observable
final class PlayerViewModel {
    var isFullPlayerPresented = false
    var dragOffset: CGFloat = 0

    let player: AudioPlayerService

    init(player: AudioPlayerService) {
        self.player = player
    }

    var progressValue: Double {
        guard player.duration > 0 else { return 0 }
        return player.currentTime / player.duration
    }

    func seek(to progress: Double) {
        player.seek(to: progress * player.duration)
    }

    var repeatIcon: String {
        switch player.repeatMode {
        case .none: return "repeat"
        case .all: return "repeat"
        case .one: return "repeat.1"
        }
    }

    var repeatIsActive: Bool {
        player.repeatMode != .none
    }
}
