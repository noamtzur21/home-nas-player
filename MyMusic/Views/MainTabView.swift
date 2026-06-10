import SwiftUI

struct MainTabView: View {
    @Environment(AudioPlayerService.self) private var player
    @Environment(PlayerViewModel.self) private var playerVM
    @State private var selectedTab = 0

    var body: some View {
        ZStack(alignment: .bottom) {
            TabView(selection: $selectedTab) {
                NavigationView { HomeView() }
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }
                    .tag(0)

                NavigationView { SearchView() }
                    .tabItem {
                        Label("Search", systemImage: "magnifyingglass")
                    }
                    .tag(1)

                NavigationView { LibraryView() }
                    .tabItem {
                        Label("Library", systemImage: "books.vertical.fill")
                    }
                    .tag(2)
            }
            .tint(.green)
            .preferredColorScheme(.dark)

            // Mini player overlay
            if player.currentSong != nil {
                VStack(spacing: 0) {
                    MiniPlayerView()
                        .padding(.bottom, 8)

                    // Spacer for tab bar
                    Color.clear.frame(height: 50)
                }
            }
        }
    }
}
