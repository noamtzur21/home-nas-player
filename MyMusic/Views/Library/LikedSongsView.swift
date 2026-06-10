import SwiftUI

struct LikedSongsView: View {
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player

    var body: some View {
        ZStack {
            LinearGradient(colors: [Color(red: 0.35, green: 0.1, blue: 0.8), .black],
                           startPoint: .top, endPoint: .center)
                .ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Header
                    VStack(alignment: .leading, spacing: 10) {
                        ZStack {
                            RoundedRectangle(cornerRadius: 12)
                                .fill(LinearGradient(
                                    colors: [Color(red: 0.55, green: 0.2, blue: 0.95), Color(red: 0.25, green: 0.05, blue: 0.6)],
                                    startPoint: .topLeading, endPoint: .bottomTrailing
                                ))
                                .frame(width: 180, height: 180)
                            Image(systemName: "heart.fill")
                                .font(.system(size: 72))
                                .foregroundColor(.white)
                        }
                        .padding(.top, 16)

                        Text("Liked Songs")
                            .font(.system(size: 28, weight: .bold))
                            .foregroundColor(.white)
                        Text("\(library.likedSongs.count) songs")
                            .font(.system(size: 14))
                            .foregroundColor(.white.opacity(0.7))
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)

                    if library.likedSongs.isEmpty {
                        VStack(spacing: 16) {
                            Image(systemName: "heart")
                                .font(.system(size: 50))
                                .foregroundColor(.white.opacity(0.3))
                                .padding(.top, 60)
                            Text("Songs you like will appear here")
                                .font(.system(size: 16))
                                .foregroundColor(.white.opacity(0.5))
                        }
                        .frame(maxWidth: .infinity)
                    } else {
                        HStack(spacing: 16) {
                            Button {
                                if let first = library.likedSongs.first {
                                    player.play(song: first, in: library.likedSongs)
                                }
                            } label: {
                                Label("Play", systemImage: "play.fill")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(.black)
                                    .frame(maxWidth: .infinity).padding(.vertical, 13)
                                    .background(Color.white).clipShape(RoundedRectangle(cornerRadius: 32))
                            }
                            Button {
                                if let first = library.likedSongs.first {
                                    player.play(song: first, in: library.likedSongs)
                                    player.toggleShuffle()
                                }
                            } label: {
                                Label("Shuffle", systemImage: "shuffle")
                                    .font(.system(size: 15, weight: .bold))
                                    .foregroundColor(.white)
                                    .frame(maxWidth: .infinity).padding(.vertical, 13)
                                    .background(Color.white.opacity(0.15)).clipShape(RoundedRectangle(cornerRadius: 32))
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.bottom, 16)

                        LazyVStack(spacing: 0) {
                            ForEach(library.likedSongs) { song in
                                SongRow(song: song, isPlaying: player.currentSong?.id == song.id) {
                                    player.play(song: song, in: library.likedSongs)
                                }
                                .padding(.horizontal, 20)
                                .contextMenu {
                                    Button {
                                        library.toggleLike(song)
                                    } label: {
                                        Label("Remove from Liked", systemImage: "heart.slash")
                                    }
                                    Button("Add to Queue") { player.addToQueue(song) }
                                }
                                Divider().background(Color.white.opacity(0.08)).padding(.leading, 80)
                            }
                        }
                    }
                    Spacer(minLength: 100)
                }
            }
        }
        .navigationTitle("Liked Songs")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct LikedSongsCard: View {
    let count: Int

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 4)
                    .fill(LinearGradient(
                        colors: [Color(red: 0.55, green: 0.2, blue: 0.95), Color(red: 0.25, green: 0.05, blue: 0.6)],
                        startPoint: .topLeading, endPoint: .bottomTrailing
                    ))
                    .frame(width: 52, height: 52)
                Image(systemName: "heart.fill")
                    .font(.system(size: 22))
                    .foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text("Liked Songs")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
                Text("\(count) songs")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.6))
            }
            Spacer()
        }
        .background(Color(white: 0.15))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
