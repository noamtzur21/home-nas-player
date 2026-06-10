import SwiftUI

@main
struct MyMusicApp: App {
    @State private var audioPlayer: AudioPlayerService
    @State private var library = MusicLibraryService()
    @State private var playerVM: PlayerViewModel

    init() {
        let player = AudioPlayerService()
        let lib = MusicLibraryService()
        player.onSongStarted = { song in
            lib.recordPlay(song)
        }
        _audioPlayer = State(initialValue: player)
        _library = State(initialValue: lib)
        _playerVM = State(initialValue: PlayerViewModel(player: player))
    }

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environment(audioPlayer)
                .environment(library)
                .environment(playerVM)
        }
    }
}
