import SwiftUI

struct MiniPlayerView: View {
    @Environment(AudioPlayerService.self) private var player
    @Environment(PlayerViewModel.self) private var vm

    var body: some View {
        VStack(spacing: 0) {
            // Progress bar at top
            GeometryReader { geo in
                Rectangle()
                    .fill(Color.green)
                    .frame(width: geo.size.width * vm.progressValue, height: 2)
            }
            .frame(height: 2)

            HStack(spacing: 12) {
                ArtworkView(artworkData: player.currentSong?.artworkData, size: 44, cornerRadius: 6)
                    .padding(.leading, 12)

                VStack(alignment: .leading, spacing: 2) {
                    Text(player.currentSong?.title ?? "Not Playing")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    Text(player.currentSong?.artist ?? "")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.6))
                        .lineLimit(1)
                }

                Spacer()

                HStack(spacing: 20) {
                    Button { player.togglePlayPause() } label: {
                        Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.white)
                    }
                    Button { player.next() } label: {
                        Image(systemName: "forward.fill")
                            .font(.system(size: 18))
                            .foregroundColor(.white)
                    }
                }
                .padding(.trailing, 16)
            }
            .frame(height: 64)
            .background(
                ZStack {
                    Color(white: 0.12)
                    if let data = player.currentSong?.artworkData,
                       let uiImage = UIImage(data: data),
                       let color = uiImage.averageColor {
                        Color(color).opacity(0.15)
                    }
                }
            )
        }
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.4), radius: 8, y: -2)
        .padding(.horizontal, 8)
        .onTapGesture {
            vm.isFullPlayerPresented = true
        }
        .sheet(isPresented: Binding(
            get: { vm.isFullPlayerPresented },
            set: { vm.isFullPlayerPresented = $0 }
        )) {
            FullPlayerView()
                .presentationDetents([.large])
                .presentationDragIndicator(.hidden)
        }
    }
}
