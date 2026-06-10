import Foundation
import AVFoundation
import UIKit
import Observation

@Observable
final class MusicLibraryService {
    private(set) var songs: [Song] = []
    private(set) var playlists: [Playlist] = []
    private(set) var isLoading = false

    private let songsKey = "saved_songs"
    private let playlistsKey = "saved_playlists"
    private let musicDirectory: URL

    init() {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        musicDirectory = docs.appendingPathComponent("Music", isDirectory: true)
        try? FileManager.default.createDirectory(at: musicDirectory, withIntermediateDirectories: true)
        load()
    }

    // MARK: - Songs

    func addSong(from sourceURL: URL) async throws -> Song {
        let fileName = sourceURL.lastPathComponent
        let destURL = musicDirectory.appendingPathComponent(fileName)

        if !FileManager.default.fileExists(atPath: destURL.path) {
            try FileManager.default.copyItem(at: sourceURL, to: destURL)
        }

        let asset = AVURLAsset(url: destURL)
        let duration = try await asset.load(.duration).seconds

        var title = fileName.components(separatedBy: ".").dropLast().joined(separator: ".")
        var artist = "Unknown Artist"
        var album = "Unknown Album"
        var artworkData: Data?

        let metadata = try await asset.load(.commonMetadata)
        for item in metadata {
            switch item.commonKey {
            case .commonKeyTitle:
                title = try await item.load(.stringValue) ?? title
            case .commonKeyArtist:
                artist = try await item.load(.stringValue) ?? artist
            case .commonKeyAlbumName:
                album = try await item.load(.stringValue) ?? album
            case .commonKeyArtwork:
                artworkData = try await item.load(.dataValue)
            default: break
            }
        }

        let song = Song(
            title: title,
            artist: artist,
            album: album,
            duration: duration,
            fileURL: destURL,
            artworkData: artworkData,
            isDownloaded: true
        )

        await MainActor.run {
            songs.append(song)
            saveSongs()
        }
        return song
    }

    func deleteSong(_ song: Song) {
        if let url = song.fileURL {
            try? FileManager.default.removeItem(at: url)
        }
        songs.removeAll { $0.id == song.id }
        for i in playlists.indices {
            playlists[i].songs.removeAll { $0.id == song.id }
        }
        saveSongs()
        savePlaylists()
    }

    // MARK: - Playlists

    func createPlaylist(name: String) -> Playlist {
        let playlist = Playlist(name: name)
        playlists.append(playlist)
        savePlaylists()
        return playlist
    }

    func deletePlaylist(_ playlist: Playlist) {
        playlists.removeAll { $0.id == playlist.id }
        savePlaylists()
    }

    func addSong(_ song: Song, to playlist: Playlist) {
        guard let idx = playlists.firstIndex(where: { $0.id == playlist.id }) else { return }
        if !playlists[idx].songs.contains(where: { $0.id == song.id }) {
            playlists[idx].songs.append(song)
            savePlaylists()
        }
    }

    func removeSong(_ song: Song, from playlist: Playlist) {
        guard let idx = playlists.firstIndex(where: { $0.id == playlist.id }) else { return }
        playlists[idx].songs.removeAll { $0.id == song.id }
        savePlaylists()
    }

    func renamePlaylist(_ playlist: Playlist, to name: String) {
        guard let idx = playlists.firstIndex(where: { $0.id == playlist.id }) else { return }
        playlists[idx].name = name
        savePlaylists()
    }

    // MARK: - Likes

    func toggleLike(_ song: Song) {
        guard let idx = songs.firstIndex(where: { $0.id == song.id }) else { return }
        songs[idx].isLiked.toggle()
        saveSongs()
    }

    var likedSongs: [Song] { songs.filter { $0.isLiked } }

    // MARK: - Play tracking

    func recordPlay(_ song: Song) {
        guard let idx = songs.firstIndex(where: { $0.id == song.id }) else { return }
        songs[idx].playCount += 1
        songs[idx].lastPlayedAt = Date()
        saveSongs()
    }

    var recentlyPlayed: [Song] {
        songs.filter { $0.lastPlayedAt != nil }
            .sorted { ($0.lastPlayedAt ?? .distantPast) > ($1.lastPlayedAt ?? .distantPast) }
            .prefix(30)
            .map { $0 }
    }

    var mostPlayed: [Song] {
        songs.filter { $0.playCount > 0 }
            .sorted { $0.playCount > $1.playCount }
            .prefix(20)
            .map { $0 }
    }

    // MARK: - Artists & Albums

    var artists: [String] {
        Array(Set(songs.map { $0.artist })).sorted()
    }

    func songs(byArtist artist: String) -> [Song] {
        songs.filter { $0.artist == artist }
    }

    var albums: [(name: String, artist: String, songs: [Song])] {
        let grouped = Dictionary(grouping: songs) { "\($0.album)||||\($0.artist)" }
        return grouped.map { key, songs in
            let parts = key.components(separatedBy: "||||")
            return (name: parts[0], artist: parts.count > 1 ? parts[1] : "", songs: songs)
        }.sorted { $0.name < $1.name }
    }

    // MARK: - Search

    func search(query: String) -> [Song] {
        guard !query.isEmpty else { return songs }
        let q = query.lowercased()
        return songs.filter {
            $0.title.lowercased().contains(q) ||
            $0.artist.lowercased().contains(q) ||
            $0.album.lowercased().contains(q)
        }
    }

    // MARK: - Persistence

    private func load() {
        if let data = UserDefaults.standard.data(forKey: songsKey),
           let decoded = try? JSONDecoder().decode([Song].self, from: data) {
            songs = decoded
        }
        if let data = UserDefaults.standard.data(forKey: playlistsKey),
           let decoded = try? JSONDecoder().decode([Playlist].self, from: data) {
            playlists = decoded
        }
    }

    private func saveSongs() {
        if let data = try? JSONEncoder().encode(songs) {
            UserDefaults.standard.set(data, forKey: songsKey)
        }
    }

    private func savePlaylists() {
        if let data = try? JSONEncoder().encode(playlists) {
            UserDefaults.standard.set(data, forKey: playlistsKey)
        }
    }
}
