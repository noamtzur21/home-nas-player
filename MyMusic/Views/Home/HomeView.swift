import SwiftUI

struct HomeView: View {
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player

    private let greeting: String = {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 { return "Good Morning" }
        if hour < 17 { return "Good Afternoon" }
        return "Good Evening"
    }()

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 28) {
                    // Header
                    HStack {
                        Text(greeting)
                            .font(.system(size: 26, weight: .bold))
                            .foregroundColor(.white)
                        Spacer()
                        Button {} label: {
                            Image(systemName: "bell")
                                .font(.system(size: 20))
                                .foregroundColor(.white)
                        }
                        Button {} label: {
                            Image(systemName: "clock.arrow.circlepath")
                                .font(.system(size: 20))
                                .foregroundColor(.white)
                        }
                        Button {} label: {
                            Image(systemName: "gearshape")
                                .font(.system(size: 20))
                                .foregroundColor(.white)
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 8)

                    // Quick access: playlists + Liked Songs
                    if !library.playlists.isEmpty || !library.likedSongs.isEmpty {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 8) {
                            if !library.likedSongs.isEmpty {
                                NavigationLink(destination: LikedSongsView()) {
                                    LikedSongsCard(count: library.likedSongs.count)
                                }
                                .buttonStyle(.plain)
                            }
                            ForEach(library.playlists.prefix(5)) { playlist in
                                NavigationLink(destination: PlaylistDetailView(playlist: playlist)) {
                                    QuickAccessCard(playlist: playlist)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 16)
                    }

                    // Recently played
                    if !library.recentlyPlayed.isEmpty {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Recently Played")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 16) {
                                    ForEach(library.recentlyPlayed) { song in
                                        SongCard(song: song) {
                                            player.play(song: song, in: library.recentlyPlayed)
                                        }
                                    }
                                }
                                .padding(.horizontal, 20)
                            }
                        }
                    }

                    // Recently added
                    if !library.songs.isEmpty {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Recently Added")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 16) {
                                    ForEach(library.songs.suffix(10).reversed()) { song in
                                        SongCard(song: song) {
                                            player.play(song: song, in: library.songs)
                                        }
                                    }
                                }
                                .padding(.horizontal, 20)
                            }
                        }
                    }

                    // All songs
                    if !library.songs.isEmpty {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("All Songs")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 20)

                            VStack(spacing: 0) {
                                ForEach(library.songs.prefix(5)) { song in
                                    SongRow(
                                        song: song,
                                        isPlaying: player.currentSong?.id == song.id
                                    ) {
                                        player.play(song: song, in: library.songs)
                                    }
                                    .padding(.horizontal, 20)
                                    Divider().background(Color.white.opacity(0.08))
                                        .padding(.leading, 80)
                                }
                            }
                        }
                    }

                    // Empty state
                    if library.songs.isEmpty {
                        EmptyHomeView()
                            .padding(.top, 60)
                    }

                    Spacer(minLength: 100)
                }
                .padding(.top, 8)
            }
        }
    }
}

struct QuickAccessCard: View {
    let playlist: Playlist

    var body: some View {
        HStack(spacing: 12) {
            ArtworkView(artworkData: playlist.songs.first?.artworkData, size: 52, cornerRadius: 4)
            Text(playlist.name)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.white)
                .lineLimit(2)
            Spacer()
        }
        .background(Color(white: 0.15))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

struct SongCard: View {
    let song: Song
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                ArtworkView(artworkData: song.artworkData, size: 140, cornerRadius: 8)
                VStack(alignment: .leading, spacing: 2) {
                    Text(song.title)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text(song.artist)
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.6))
                        .lineLimit(1)
                }
                .frame(width: 140, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }
}

struct EmptyHomeView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "music.note.list")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.2))
            Text("No music yet")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
            Text("Import your music files from\nthe Library tab to get started")
                .font(.system(size: 15))
                .foregroundColor(.white.opacity(0.5))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
    }
}
