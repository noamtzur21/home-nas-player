import SwiftUI

struct ArtworkView: View {
    let artworkData: Data?
    var size: CGFloat = 56
    var cornerRadius: CGFloat = 8

    var body: some View {
        Group {
            if let data = artworkData, let image = UIImage(data: data) {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                ZStack {
                    LinearGradient(
                        colors: [Color(white: 0.2), Color(white: 0.12)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    Image(systemName: "music.note")
                        .font(.system(size: size * 0.35))
                        .foregroundColor(.white.opacity(0.5))
                }
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
    }
}

struct SongRow: View {
    let song: Song
    let isPlaying: Bool
    var onTap: () -> Void
    var onMenu: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: 12) {
            ArtworkView(artworkData: song.artworkData, size: 48)

            VStack(alignment: .leading, spacing: 3) {
                Text(song.title)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(isPlaying ? .green : .white)
                    .lineLimit(1)
                Text(song.artist)
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.6))
                    .lineLimit(1)
            }

            Spacer()

            if isPlaying {
                PlayingIndicator()
            }

            Text(song.formattedDuration)
                .font(.system(size: 13))
                .foregroundColor(.white.opacity(0.4))
                .frame(width: 36)
        }
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
        .padding(.vertical, 4)
    }
}

struct PlayingIndicator: View {
    @State private var animating = false

    var body: some View {
        HStack(alignment: .bottom, spacing: 2) {
            ForEach(0..<3) { i in
                RoundedRectangle(cornerRadius: 1.5)
                    .fill(Color.green)
                    .frame(width: 3, height: animating ? CGFloat([12, 8, 14][i]) : CGFloat([6, 10, 4][i]))
                    .animation(
                        .easeInOut(duration: 0.4 + Double(i) * 0.1)
                        .repeatForever(autoreverses: true)
                        .delay(Double(i) * 0.1),
                        value: animating
                    )
            }
        }
        .frame(width: 16, height: 16)
        .onAppear { animating = true }
    }
}
