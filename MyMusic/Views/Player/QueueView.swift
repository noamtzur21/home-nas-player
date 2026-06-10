import SwiftUI

struct QueueView: View {
    @Environment(AudioPlayerService.self) private var player
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 0) {
                HStack {
                    Text("Up Next")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Button("Done") { dismiss() }
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 16)

                if let current = player.currentSong {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Now Playing")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.green)
                            .padding(.horizontal, 20)
                        SongRow(song: current, isPlaying: true) {}
                            .padding(.horizontal, 20)
                    }
                    .padding(.bottom, 12)
                    Divider().background(Color.white.opacity(0.1))
                }

                let upNext = player.queue.dropFirst(player.currentIndex + 1)
                if upNext.isEmpty {
                    Spacer()
                    Text("Queue is empty")
                        .font(.system(size: 16))
                        .foregroundColor(.white.opacity(0.4))
                    Spacer()
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Next in queue")
                            .font(.system(size: 13, weight: .semibold))
                            .foregroundColor(.white.opacity(0.5))
                            .padding(.horizontal, 20)
                            .padding(.top, 12)

                        ScrollView(showsIndicators: false) {
                            LazyVStack(spacing: 0) {
                                ForEach(Array(upNext.enumerated()), id: \.element.id) { i, song in
                                    SongRow(song: song, isPlaying: false) {
                                        player.play(song: song, in: player.queue)
                                    }
                                    .padding(.horizontal, 20)
                                    .swipeActions(edge: .trailing) {
                                        Button(role: .destructive) {
                                            player.removeFromQueue(at: player.currentIndex + 1 + i)
                                        } label: {
                                            Label("Remove", systemImage: "trash")
                                        }
                                    }
                                    Divider().background(Color.white.opacity(0.08)).padding(.leading, 80)
                                }
                            }
                            Spacer(minLength: 60)
                        }
                    }
                }
            }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
