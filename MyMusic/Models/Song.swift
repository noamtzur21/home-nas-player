import Foundation
import AVFoundation

struct Song: Identifiable, Equatable, Codable {
    let id: UUID
    var title: String
    var artist: String
    var album: String
    var duration: TimeInterval
    var fileURL: URL?
    var artworkData: Data?
    var isDownloaded: Bool
    var isLiked: Bool
    var playCount: Int
    var lastPlayedAt: Date?

    init(
        id: UUID = UUID(),
        title: String,
        artist: String,
        album: String = "Unknown Album",
        duration: TimeInterval = 0,
        fileURL: URL? = nil,
        artworkData: Data? = nil,
        isDownloaded: Bool = false,
        isLiked: Bool = false,
        playCount: Int = 0,
        lastPlayedAt: Date? = nil
    ) {
        self.id = id
        self.title = title
        self.artist = artist
        self.album = album
        self.duration = duration
        self.fileURL = fileURL
        self.artworkData = artworkData
        self.isDownloaded = isDownloaded
        self.isLiked = isLiked
        self.playCount = playCount
        self.lastPlayedAt = lastPlayedAt
    }

    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    static func == (lhs: Song, rhs: Song) -> Bool {
        lhs.id == rhs.id
    }

    enum CodingKeys: String, CodingKey {
        case id, title, artist, album, duration, artworkData, isDownloaded, isLiked, playCount, lastPlayedAt
        case fileURLString
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        title = try container.decode(String.self, forKey: .title)
        artist = try container.decode(String.self, forKey: .artist)
        album = try container.decode(String.self, forKey: .album)
        duration = try container.decode(TimeInterval.self, forKey: .duration)
        artworkData = try container.decodeIfPresent(Data.self, forKey: .artworkData)
        isDownloaded = try container.decodeIfPresent(Bool.self, forKey: .isDownloaded) ?? false
        isLiked = try container.decodeIfPresent(Bool.self, forKey: .isLiked) ?? false
        playCount = try container.decodeIfPresent(Int.self, forKey: .playCount) ?? 0
        lastPlayedAt = try container.decodeIfPresent(Date.self, forKey: .lastPlayedAt)
        if let urlString = try container.decodeIfPresent(String.self, forKey: .fileURLString) {
            fileURL = URL(string: urlString)
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(title, forKey: .title)
        try container.encode(artist, forKey: .artist)
        try container.encode(album, forKey: .album)
        try container.encode(duration, forKey: .duration)
        try container.encodeIfPresent(artworkData, forKey: .artworkData)
        try container.encode(isDownloaded, forKey: .isDownloaded)
        try container.encode(isLiked, forKey: .isLiked)
        try container.encode(playCount, forKey: .playCount)
        try container.encodeIfPresent(lastPlayedAt, forKey: .lastPlayedAt)
        try container.encodeIfPresent(fileURL?.absoluteString, forKey: .fileURLString)
    }
}
