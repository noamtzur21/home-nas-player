import Foundation

struct Playlist: Identifiable, Codable, Equatable {
    let id: UUID
    var name: String
    var songs: [Song]
    var createdAt: Date
    var coverArtData: Data?

    init(
        id: UUID = UUID(),
        name: String,
        songs: [Song] = [],
        createdAt: Date = Date(),
        coverArtData: Data? = nil
    ) {
        self.id = id
        self.name = name
        self.songs = songs
        self.createdAt = createdAt
        self.coverArtData = coverArtData
    }

    var totalDuration: TimeInterval {
        songs.reduce(0) { $0 + $1.duration }
    }

    var formattedTotalDuration: String {
        let minutes = Int(totalDuration) / 60
        if minutes >= 60 {
            let hours = minutes / 60
            let mins = minutes % 60
            return "\(hours) hr \(mins) min"
        }
        return "\(minutes) min"
    }

    static func == (lhs: Playlist, rhs: Playlist) -> Bool {
        lhs.id == rhs.id
    }
}
