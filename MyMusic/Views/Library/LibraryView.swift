import SwiftUI
import UniformTypeIdentifiers

struct LibraryView: View {
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player
    @State private var viewModel: LibraryViewModel?
    @State private var vm: LibraryViewModel = LibraryViewModel(
        library: MusicLibraryService(),
        player: AudioPlayerService()
    )
    @State private var showDeleteAlert = false
    @State private var songToDelete: Song?
    @State private var selectedTab: LibTab = .playlists

    enum LibTab: String, CaseIterable {
        case playlists = "Playlists"
        case songs = "Songs"
        case artists = "Artists"
        case albums = "Albums"
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    Text("Your Library")
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Button {
                        if selectedTab == .playlists {
                            vm.showAddPlaylistSheet = true
                        } else {
                            vm.showFileImporter = true
                        }
                    } label: {
                        Image(systemName: "plus")
                            .font(.system(size: 20, weight: .medium))
                            .foregroundColor(.white)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)

                // Tab picker
                HStack(spacing: 0) {
                    ForEach(LibTab.allCases, id: \.self) { tab in
                        Button {
                            selectedTab = tab
                        } label: {
                            Text(tab.rawValue)
                                .font(.system(size: 14, weight: .semibold))
                                .foregroundColor(selectedTab == tab ? .black : .white.opacity(0.6))
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(selectedTab == tab ? Color.white : Color.clear)
                                .clipShape(Capsule())
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 12)

                switch selectedTab {
                case .playlists: playlistsContent
                case .songs: songsContent
                case .artists: ArtistsView()
                case .albums: AlbumsView()
                }
            }
        }
        .onAppear {
            vm = LibraryViewModel(library: library, player: player)
        }
        .sheet(isPresented: $vm.showAddPlaylistSheet) {
            NewPlaylistSheet(vm: vm)
        }
        .fileImporter(
            isPresented: $vm.showFileImporter,
            allowedContentTypes: [.audio, UTType("public.mp3")!, .init(filenameExtension: "flac")!],
            allowsMultipleSelection: true
        ) { result in
            if let urls = try? result.get() {
                Task {
                    for url in urls {
                        await vm.importFile(url: url)
                    }
                }
            }
        }
    }

    private var playlistsContent: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: 0) {
                if library.playlists.isEmpty {
                    EmptyPlaylistsView {
                        vm.showAddPlaylistSheet = true
                    }
                    .padding(.top, 60)
                } else {
                    ForEach(library.playlists) { playlist in
                        NavigationLink(destination: PlaylistDetailView(playlist: playlist)) {
                            PlaylistRow(playlist: playlist)
                        }
                        .buttonStyle(.plain)
                        Divider().background(Color.white.opacity(0.08))
                            .padding(.leading, 76)
                    }
                }
            }
            Spacer(minLength: 100)
        }
    }

    private var songsContent: some View {
        VStack(spacing: 0) {
            // Search
            HStack {
                Image(systemName: "magnifyingglass")
                    .foregroundColor(.white.opacity(0.4))
                TextField("Find in songs", text: $vm.searchText)
                    .foregroundColor(.white)
                    .tint(.green)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 10)
            .background(Color(white: 0.15))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .padding(.horizontal, 16)
            .padding(.bottom, 8)

            ScrollView(showsIndicators: false) {
                LazyVStack(spacing: 0) {
                    ForEach(vm.filteredSongs) { song in
                        SongRow(
                            song: song,
                            isPlaying: player.currentSong?.id == song.id
                        ) {
                            player.play(song: song, in: vm.filteredSongs)
                        }
                        .padding(.horizontal, 20)
                        .contextMenu {
                            Button("Add to Playlist") {}
                            Button("Add to Queue") {
                                player.addToQueue(song)
                            }
                            Divider()
                            Button("Delete", role: .destructive) {
                                songToDelete = song
                                showDeleteAlert = true
                            }
                        }
                        Divider().background(Color.white.opacity(0.08))
                            .padding(.leading, 80)
                    }
                }
                Spacer(minLength: 100)
            }
        }
        .alert("Delete Song", isPresented: $showDeleteAlert) {
            Button("Delete", role: .destructive) {
                if let song = songToDelete {
                    library.deleteSong(song)
                }
            }
            Button("Cancel", role: .cancel) {}
        } message: {
            Text("This will remove the song from your library.")
        }
    }
}

struct PlaylistRow: View {
    let playlist: Playlist

    var body: some View {
        HStack(spacing: 14) {
            ArtworkView(artworkData: playlist.songs.first?.artworkData, size: 56, cornerRadius: 6)
            VStack(alignment: .leading, spacing: 4) {
                Text(playlist.name)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(.white)
                Text("Playlist · \(playlist.songs.count) songs")
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

struct EmptyPlaylistsView: View {
    var onCreate: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "music.note.list")
                .font(.system(size: 60))
                .foregroundColor(.white.opacity(0.2))
            Text("No playlists yet")
                .font(.system(size: 20, weight: .bold))
                .foregroundColor(.white)
            Button(action: onCreate) {
                Text("Create playlist")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(.black)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.white)
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct NewPlaylistSheet: View {
    @Bindable var vm: LibraryViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                Color.black.ignoresSafeArea()
                VStack(spacing: 32) {
                    Image(systemName: "music.note.list")
                        .font(.system(size: 60))
                        .foregroundColor(.white.opacity(0.3))
                        .padding(.top, 32)

                    TextField("My Playlist #1", text: $vm.newPlaylistName)
                        .font(.system(size: 22, weight: .bold))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .padding(.vertical, 16)
                        .overlay(
                            Rectangle()
                                .frame(height: 1)
                                .foregroundColor(.white.opacity(0.3)),
                            alignment: .bottom
                        )
                        .padding(.horizontal, 40)

                    Spacer()
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundColor(.white)
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Create") {
                        vm.createPlaylist()
                    }
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(vm.newPlaylistName.isEmpty ? .white.opacity(0.3) : .white)
                    .disabled(vm.newPlaylistName.isEmpty)
                }
            }
        }
        .preferredColorScheme(.dark)
    }
}
