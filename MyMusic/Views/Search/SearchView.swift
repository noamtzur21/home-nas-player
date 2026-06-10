import SwiftUI

struct SearchView: View {
    @Environment(MusicLibraryService.self) private var library
    @Environment(AudioPlayerService.self) private var player
    @State private var searchText = ""
    @FocusState private var isFocused: Bool

    var results: [Song] {
        library.search(query: searchText)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                Text("Search")
                    .font(.system(size: 22, weight: .bold))
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal, 20)
                    .padding(.vertical, 16)

                // Search bar
                HStack(spacing: 10) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(isFocused ? .white : .white.opacity(0.5))
                        .font(.system(size: 16))
                    TextField("Songs, artists, albums", text: $searchText)
                        .foregroundColor(.white)
                        .tint(.green)
                        .focused($isFocused)
                    if !searchText.isEmpty {
                        Button {
                            searchText = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(.white.opacity(0.5))
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color(white: 0.15))
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .padding(.horizontal, 16)
                .padding(.bottom, 16)
                .onTapGesture { isFocused = true }

                if searchText.isEmpty {
                    browseGrid
                } else {
                    searchResults
                }
            }
        }
    }

    private var browseGrid: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Browse your library")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 20)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(Array(browseCells.enumerated()), id: \.offset) { _, cell in
                        BrowseCell(title: cell.title, color: cell.color, icon: cell.icon)
                    }
                }
                .padding(.horizontal, 16)

                Spacer(minLength: 100)
            }
        }
    }

    private var searchResults: some View {
        ScrollView(showsIndicators: false) {
            LazyVStack(spacing: 0) {
                if results.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 40))
                            .foregroundColor(.white.opacity(0.2))
                            .padding(.top, 60)
                        Text("No results for \"\(searchText)\"")
                            .font(.system(size: 16))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    ForEach(results) { song in
                        SongRow(
                            song: song,
                            isPlaying: player.currentSong?.id == song.id
                        ) {
                            player.play(song: song, in: results)
                        }
                        .padding(.horizontal, 20)
                        Divider().background(Color.white.opacity(0.08))
                            .padding(.leading, 80)
                    }
                }
                Spacer(minLength: 100)
            }
        }
    }

    private var browseCells: [(title: String, color: Color, icon: String)] {
        [
            ("Songs", .purple, "music.note"),
            ("Artists", .blue, "person.fill"),
            ("Albums", .pink, "square.stack.fill"),
            ("Playlists", .green, "music.note.list"),
            ("Downloaded", .orange, "arrow.down.circle.fill"),
            ("Recently Played", .red, "clock.fill")
        ]
    }
}

struct BrowseCell: View {
    let title: String
    let color: Color
    let icon: String

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            RoundedRectangle(cornerRadius: 8)
                .fill(color.opacity(0.8))
                .frame(height: 100)
            HStack {
                Text(title)
                    .font(.system(size: 16, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
                Image(systemName: icon)
                    .font(.system(size: 28))
                    .foregroundColor(.white.opacity(0.3))
                    .rotationEffect(.degrees(10))
                    .offset(x: 8, y: 8)
            }
            .padding(12)
        }
    }
}
