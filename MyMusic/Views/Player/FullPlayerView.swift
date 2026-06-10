import SwiftUI

struct FullPlayerView: View {
    @Environment(AudioPlayerService.self) private var player
    @Environment(MusicLibraryService.self) private var library
    @Environment(PlayerViewModel.self) private var vm
    @State private var isDraggingProgress = false
    @State private var dragProgress: Double = 0
    @State private var showQueue = false
    @State private var showSleepTimer = false

    var body: some View {
        ZStack {
            backgroundGradient

            VStack(spacing: 0) {
                handleBar
                    .padding(.top, 8)

                Spacer()

                // Artwork
                ArtworkView(artworkData: player.currentSong?.artworkData, size: 300, cornerRadius: 16)
                    .shadow(color: .black.opacity(0.5), radius: 30, y: 10)
                    .scaleEffect(player.isPlaying ? 1.0 : 0.92)
                    .animation(.spring(duration: 0.3), value: player.isPlaying)
                    .padding(.horizontal, 32)

                Spacer()

                // Title + artist
                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(player.currentSong?.title ?? "Not Playing")
                                .font(.system(size: 22, weight: .bold))
                                .foregroundColor(.white)
                                .lineLimit(1)
                            Text(player.currentSong?.artist ?? "")
                                .font(.system(size: 16))
                                .foregroundColor(.white.opacity(0.7))
                                .lineLimit(1)
                        }
                        Spacer()
                        Button {
                            if let song = player.currentSong { library.toggleLike(song) }
                        } label: {
                            let liked = player.currentSong.flatMap { s in library.songs.first(where: { $0.id == s.id }) }?.isLiked == true
                            Image(systemName: liked ? "heart.fill" : "heart")
                                .font(.system(size: 22))
                                .foregroundColor(liked ? .green : .white.opacity(0.7))
                        }
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 24)

                // Progress bar
                VStack(spacing: 8) {
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            Capsule()
                                .fill(Color.white.opacity(0.2))
                                .frame(height: isDraggingProgress ? 6 : 4)
                            Capsule()
                                .fill(Color.white)
                                .frame(
                                    width: (isDraggingProgress ? dragProgress : vm.progressValue) * geo.size.width,
                                    height: isDraggingProgress ? 6 : 4
                                )
                        }
                        .gesture(
                            DragGesture(minimumDistance: 0)
                                .onChanged { val in
                                    isDraggingProgress = true
                                    dragProgress = max(0, min(1, val.location.x / geo.size.width))
                                }
                                .onEnded { val in
                                    isDraggingProgress = false
                                    vm.seek(to: dragProgress)
                                }
                        )
                    }
                    .frame(height: 20)
                    .animation(.easeInOut(duration: 0.15), value: isDraggingProgress)

                    HStack {
                        Text(formatTime(player.currentTime))
                        Spacer()
                        Text(formatTime(player.duration))
                    }
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.5))
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 32)

                // Controls
                HStack(spacing: 0) {
                    Button {
                        player.toggleShuffle()
                    } label: {
                        Image(systemName: "shuffle")
                            .font(.system(size: 20))
                            .foregroundColor(player.isShuffled ? .green : .white.opacity(0.7))
                    }
                    .frame(maxWidth: .infinity)

                    Button { player.previous() } label: {
                        Image(systemName: "backward.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)

                    Button { player.togglePlayPause() } label: {
                        ZStack {
                            Circle()
                                .fill(.white)
                                .frame(width: 72, height: 72)
                            Image(systemName: player.isPlaying ? "pause.fill" : "play.fill")
                                .font(.system(size: 28))
                                .foregroundColor(.black)
                        }
                    }
                    .frame(maxWidth: .infinity)

                    Button { player.next() } label: {
                        Image(systemName: "forward.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white)
                    }
                    .frame(maxWidth: .infinity)

                    Button { player.toggleRepeat() } label: {
                        Image(systemName: vm.repeatIcon)
                            .font(.system(size: 20))
                            .foregroundColor(vm.repeatIsActive ? .green : .white.opacity(0.7))
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, 8)
                .padding(.bottom, 20)

                // Queue + Sleep Timer
                HStack {
                    Button { showQueue = true } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "list.bullet")
                            Text("Queue")
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    }
                    Spacer()
                    Button { showSleepTimer = true } label: {
                        HStack(spacing: 6) {
                            Image(systemName: "moon.zzz")
                            Text("Sleep")
                        }
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.white.opacity(0.6))
                    }
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 20)
                .sheet(isPresented: $showQueue) { QueueView() }
                .sheet(isPresented: $showSleepTimer) { SleepTimerView() }

                // Volume
                HStack(spacing: 12) {
                    Image(systemName: "speaker.fill")
                        .foregroundColor(.white.opacity(0.5))
                        .font(.system(size: 14))
                    Slider(value: Binding(
                        get: { Double(player.volume) },
                        set: { player.setVolume(Float($0)) }
                    ))
                    .tint(.white)
                    Image(systemName: "speaker.wave.3.fill")
                        .foregroundColor(.white.opacity(0.5))
                        .font(.system(size: 14))
                }
                .padding(.horizontal, 32)
                .padding(.bottom, 40)
            }
        }
        .ignoresSafeArea()
    }

    private var handleBar: some View {
        RoundedRectangle(cornerRadius: 2.5)
            .fill(Color.white.opacity(0.3))
            .frame(width: 36, height: 5)
    }

    private var backgroundGradient: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            if let data = player.currentSong?.artworkData,
               let uiImage = UIImage(data: data),
               let color = uiImage.averageColor {
                Rectangle()
                    .fill(
                        LinearGradient(
                            colors: [Color(color).opacity(0.8), Color.black],
                            startPoint: .top,
                            endPoint: .center
                        )
                    )
                    .ignoresSafeArea()
            }
        }
    }

    private func formatTime(_ t: TimeInterval) -> String {
        let m = Int(t) / 60
        let s = Int(t) % 60
        return String(format: "%d:%02d", m, s)
    }
}
