import Foundation
import Observation

@Observable
final class LibraryViewModel {
    var showAddPlaylistSheet = false
    var newPlaylistName = ""
    var showFileImporter = false
    var selectedPlaylist: Playlist?
    var searchText = ""
    var sortOption: SortOption = .dateAdded

    let library: MusicLibraryService
    let player: AudioPlayerService

    enum SortOption: String, CaseIterable {
        case dateAdded = "Date Added"
        case title = "Title"
        case artist = "Artist"
    }

    init(library: MusicLibraryService, player: AudioPlayerService) {
        self.library = library
        self.player = player
    }

    var filteredSongs: [Song] {
        let songs = searchText.isEmpty ? library.songs : library.search(query: searchText)
        return sorted(songs)
    }

    private func sorted(_ songs: [Song]) -> [Song] {
        switch sortOption {
        case .dateAdded: return songs
        case .title: return songs.sorted { $0.title < $1.title }
        case .artist: return songs.sorted { $0.artist < $1.artist }
        }
    }

    func createPlaylist() {
        guard !newPlaylistName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        _ = library.createPlaylist(name: newPlaylistName)
        newPlaylistName = ""
        showAddPlaylistSheet = false
    }

    func playSong(_ song: Song, in songs: [Song]? = nil) {
        player.play(song: song, in: songs ?? library.songs)
    }

    func importFile(url: URL) async {
        _ = try? await library.addSong(from: url)
    }
}
