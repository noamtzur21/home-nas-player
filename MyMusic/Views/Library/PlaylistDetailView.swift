import SwiftUI

struct PlaylistDetailView: View {
    let playlist: Playlist
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player
    @State private var showAddSongs = false

    var livePlaylist: Playlist {
        library.playlists.first(where: { $0.id == playlist.id }) ?? playlist
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ScrollView(showsIndicators: false) {
                VStack(spacing: 0) {
                    // Header artwork
                    ZStack(alignment: .bottom) {
                        ArtworkView(
                            artworkData: livePlaylist.songs.first?.artworkData,
                            size: 220,
                            cornerRadius: 12
                        )
                        .padding(.top, 20)
                    }

                    // Playlist info
                    VStack(spacing: 6) {
                        Text(livePlaylist.name)
                            .font(.system(size: 24, weight: .bold))
                            .foregroundColor(.white)
                        Text("\(livePlaylist.songs.count) songs · \(livePlaylist.formattedTotalDuration)")
                            .font(.system(size: 14))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .padding(.vertical, 20)

                    // Play / Shuffle row
                    HStack(spacing: 16) {
                        Button {
                            if let first = livePlaylist.songs.first {
                                player.play(song: first, in: livePlaylist.songs)
                            }
                        } label: {
                            HStack {
                                Image(systemName: "play.fill")
                                Text("Play")
                                    .font(.system(size: 16, weight: .bold))
                            }
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: 32))
                        }

                        Button {
                            if let first = livePlaylist.songs.first {
                                player.play(song: first, in: livePlaylist.songs)
                                player.toggleShuffle()
                            }
                        } label: {
                            HStack {
                                Image(systemName: "shuffle")
                                Text("Shuffle")
                                    .font(.system(size: 16, weight: .bold))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Color(white: 0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 32))
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 20)

                    // Songs list
                    LazyVStack(spacing: 0) {
                        ForEach(livePlaylist.songs) { song in
                            SongRow(
                                song: song,
                                isPlaying: player.currentSong?.id == song.id
                            ) {
                                player.play(song: song, in: livePlaylist.songs)
                            }
                            .padding(.horizontal, 20)
                            .contextMenu {
                                Button("Remove from Playlist", role: .destructive) {
                                    library.removeSong(song, from: livePlaylist)
                                }
                                Button("Add to Queue") {
                                    player.addToQueue(song)
                                }
                            }
                            Divider().background(Color.white.opacity(0.08))
                                .padding(.leading, 80)
                        }

                        // Add songs button
                        Button {
                            showAddSongs = true
                        } label: {
                            HStack {
                                Image(systemName: "plus.circle.fill")
                                    .foregroundColor(.green)
                                Text("Add songs")
                                    .foregroundColor(.white)
                                    .font(.system(size: 15))
                            }
                            .padding(.horizontal, 20)
                            .padding(.vertical, 16)
                        }
                    }

                    Spacer(minLength: 100)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .navigationTitle(livePlaylist.name)
        .sheet(isPresented: $showAddSongs) {
            AddSongsSheet(playlist: livePlaylist)
        }
    }
}

struct AddSongsSheet: View {
    let playlist: Playlist
    @Environment(MusicLibraryService.self) private var library
    @Environment(\.dismiss) private var dismiss
    @State private var searchText = ""

    var songs: [Song] {
        let notInPlaylist = library.songs.filter { song in
            !playlist.songs.contains(where: { $0.id == song.id })
        }
        guard !searchText.isEmpty else { return notInPlaylist }
        return notInPlaylist.filter {
            $0.title.localizedCaseInsensitiveContains(searchText) ||
            $0.artist.localizedCaseInsensitiveContains(searchText)
        }
    }

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                VStack {
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.white.opacity(0.4))
                        TextField("Search", text: $searchText)
                            .foregroundColor(.white)
                    }
                    .padding(10)
                    .background(Color(white: 0.15))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .padding(.horizontal, 16)

                    List(songs) { song in
                        Button {
                            library.addSong(song, to: playlist)
                        } label: {
                            HStack {
                                ArtworkView(artworkData: song.artworkData, size: 44)
                                VStack(alignment: .leading) {
                                    Text(song.title).foregroundColor(.white).font(.system(size: 15))
                                    Text(song.artist).foregroundColor(.white.opacity(0.6)).font(.system(size: 13))
                                }
                                Spacer()
                                Image(systemName: "plus.circle")
                                    .foregroundColor(.green)
                                    .font(.system(size: 20))
                            }
                        }
                        .listRowBackground(Color.black)
                    }
                    .listStyle(.plain)
                }
            }
            .navigationTitle("Add Songs")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }.foregroundColor(.white)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
