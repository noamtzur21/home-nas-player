import SwiftUI

struct AlbumsView: View {
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player

    let columns = [GridItem(.flexible()), GridItem(.flexible())]

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if library.albums.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "square.stack.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.white.opacity(0.2))
                    Text("No albums yet")
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(.white)
                }
            } else {
                ScrollView(showsIndicators: false) {
                    LazyVGrid(columns: columns, spacing: 20) {
                        ForEach(library.albums, id: \.name) { album in
                            NavigationLink(destination: AlbumDetailView(albumName: album.name, artist: album.artist, songs: album.songs)) {
                                AlbumCard(album: album)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                    Spacer(minLength: 100)
                }
            }
        }
    }
}

struct AlbumCard: View {
    let album: (name: String, artist: String, songs: [Song])

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            ArtworkView(artworkData: album.songs.first?.artworkData, size: (UIScreen.main.bounds.width - 48) / 2, cornerRadius: 8)
            VStack(alignment: .leading, spacing: 3) {
                Text(album.name)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text(album.artist)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.6))
                    .lineLimit(1)
            }
        }
    }
}

struct AlbumDetailView: View {
    let albumName: String
    let artist: String
    let songs: [Song]
    @Environment(AudioPlayerService.self) private var player

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    ArtworkView(artworkData: songs.first?.artworkData, size: 200, cornerRadius: 12)
                        .padding(.vertical, 24)
                    Text(albumName)
                        .font(.system(size: 22, weight: .bold)).foregroundColor(.white)
                    Text(artist)
                        .font(.system(size: 15)).foregroundColor(.white.opacity(0.6))
                        .padding(.bottom, 20)

                    HStack(spacing: 16) {
                        Button {
                            if let first = songs.first { player.play(song: first, in: songs) }
                        } label: {
                            Label("Play", systemImage: "play.fill")
                                .font(.system(size: 15, weight: .bold)).foregroundColor(.black)
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(Color.white).clipShape(RoundedRectangle(cornerRadius: 32))
                        }
                        Button {
                            if let first = songs.first { player.play(song: first, in: songs); player.toggleShuffle() }
                        } label: {
                            Label("Shuffle", systemImage: "shuffle")
                                .font(.system(size: 15, weight: .bold)).foregroundColor(.white)
                                .frame(maxWidth: .infinity).padding(.vertical, 13)
                                .background(Color(white: 0.2)).clipShape(RoundedRectangle(cornerRadius: 32))
                        }
                    }
                    .padding(.horizontal, 20).padding(.bottom, 20)

                    LazyVStack(spacing: 0) {
                        ForEach(Array(songs.enumerated()), id: \.element.id) { i, song in
                            HStack(spacing: 14) {
                                Text("\(i + 1)")
                                    .font(.system(size: 15))
                                    .foregroundColor(player.currentSong?.id == song.id ? .green : .white.opacity(0.4))
                                    .frame(width: 24)
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(song.title)
                                        .font(.system(size: 15, weight: .medium))
                                        .foregroundColor(player.currentSong?.id == song.id ? .green : .white)
                                        .lineLimit(1)
                                    Text(song.artist)
                                        .font(.system(size: 13))
                                        .foregroundColor(.white.opacity(0.6)).lineLimit(1)
                                }
                                Spacer()
                                Text(song.formattedDuration)
                                    .font(.system(size: 13)).foregroundColor(.white.opacity(0.4))
                            }
                            .contentShape(Rectangle())
                            .onTapGesture { player.play(song: song, in: songs) }
                            .padding(.horizontal, 20).padding(.vertical, 10)
                            Divider().background(Color.white.opacity(0.08)).padding(.leading, 58)
                        }
                    }
                    Spacer(minLength: 100)
                }
            }
        }
        .navigationTitle(albumName)
        .navigationBarTitleDisplayMode(.inline)
    }
}
