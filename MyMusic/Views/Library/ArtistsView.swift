import SwiftUI

struct ArtistsView: View {
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if library.artists.isEmpty {
                emptyState
            } else {
                ScrollView(showsIndicators: false) {
                    LazyVStack(spacing: 0) {
                        ForEach(library.artists, id: \.self) { artist in
                            NavigationLink(destination: ArtistDetailView(artist: artist)) {
                                ArtistRow(
                                    artist: artist,
                                    songCount: library.songs(byArtist: artist).count,
                                    artworkData: library.songs(byArtist: artist).first?.artworkData
                                )
                            }
                            .buttonStyle(.plain)
                            Divider().background(Color.white.opacity(0.08)).padding(.leading, 76)
                        }
                    }
                    Spacer(minLength: 100)
                }
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 50))
                .foregroundColor(.white.opacity(0.2))
            Text("No artists yet")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(.white)
        }
    }
}

struct ArtistRow: View {
    let artist: String
    let songCount: Int
    let artworkData: Data?

    var body: some View {
        HStack(spacing: 14) {
            ArtworkView(artworkData: artworkData, size: 56, cornerRadius: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text(artist)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                Text("\(songCount) songs")
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.6))
            }
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.3))
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
    }
}

struct ArtistDetailView: View {
    let artist: String
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player

    var songs: [Song] { library.songs(byArtist: artist) }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    ArtworkView(artworkData: songs.first?.artworkData, size: 180, cornerRadius: 90)
                        .padding(.vertical, 24)

                    Text(artist)
                        .font(.system(size: 26, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.bottom, 6)

                    Text("\(songs.count) songs")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.5))
                        .padding(.bottom, 24)

                    HStack(spacing: 16) {
                        Button {
                            if let first = songs.first { player.play(song: first, in: songs) }
                        } label: {
                            Label("Play", systemImage: "play.fill")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(Color.white).clipShape(RoundedRectangle(cornerRadius: 32))
                        }
                        Button {
                            if let first = songs.first {
                                player.play(song: first, in: songs)
                                player.toggleShuffle()
                            }
                        } label: {
                            Label("Shuffle", systemImage: "shuffle")
                                .font(.system(size: 15, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(Color(white: 0.2)).clipShape(RoundedRectangle(cornerRadius: 32))
                        }
                    }
                    .padding(.horizontal, 20).padding(.bottom, 20)

                    LazyVStack(spacing: 0) {
                        ForEach(songs) { song in
                            SongRow(song: song, isPlaying: player.currentSong?.id == song.id) {
                                player.play(song: song, in: songs)
                            }
                            .padding(.horizontal, 20)
                            Divider().background(Color.white.opacity(0.08)).padding(.leading, 80)
                        }
                    }
                    Spacer(minLength: 100)
                }
            }
        }
        .navigationTitle(artist)
        .navigationBarTitleDisplayMode(.inline)
    }
}
