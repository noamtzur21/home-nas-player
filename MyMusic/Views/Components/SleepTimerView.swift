import SwiftUI

struct SleepTimerView: View {
    @Environment(AudioPlayerService.self) private var player
    @Environment(\.dismiss) private var dismiss
    @State private var selectedMinutes: Int = 30
    @State private var isActive = false
    @State private var timer: Timer?
    @State private var remaining: TimeInterval = 0

    let options = [5, 10, 15, 20, 30, 45, 60, 90]

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            VStack(spacing: 24) {
                HStack {
                    Text("Sleep Timer")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    Button("Done") { dismiss() }.foregroundColor(.white)
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)

                if isActive {
                    VStack(spacing: 12) {
                        ZStack {
                            Circle()
                                .stroke(Color(white: 0.2), lineWidth: 8)
                                .frame(width: 140, height: 140)
                            Circle()
                                .trim(from: 0, to: remaining / (Double(selectedMinutes) * 60))
                                .stroke(Color.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                                .frame(width: 140, height: 140)
                                .rotationEffect(.degrees(-90))
                                .animation(.linear(duration: 1), value: remaining)
                            VStack(spacing: 4) {
                                Text(formatRemaining())
                                    .font(.system(size: 28, weight: .bold))
                                    .foregroundColor(.white)
                                Text("remaining")
                                    .font(.system(size: 13))
                                    .foregroundColor(.white.opacity(0.5))
                            }
                        }
                        .padding(.vertical, 20)

                        Button {
                            cancelTimer()
                        } label: {
                            Text("Cancel Timer")
                                .font(.system(size: 16, weight: .semibold))
                                .foregroundColor(.red)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color.red.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                        .padding(.horizontal, 20)
                    }
                } else {
                    VStack(spacing: 16) {
                        Text("Stop playing after")
                            .font(.system(size: 15))
                            .foregroundColor(.white.opacity(0.6))

                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(options, id: \.self) { mins in
                                Button {
                                    selectedMinutes = mins
                                } label: {
                                    VStack(spacing: 4) {
                                        Text("\(mins)")
                                            .font(.system(size: 20, weight: .bold))
                                            .foregroundColor(selectedMinutes == mins ? .black : .white)
                                        Text("min")
                                            .font(.system(size: 11))
                                            .foregroundColor(selectedMinutes == mins ? .black.opacity(0.6) : .white.opacity(0.5))
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 14)
                                    .background(selectedMinutes == mins ? Color.green : Color(white: 0.18))
                                    .clipShape(RoundedRectangle(cornerRadius: 10))
                                }
                            }
                        }
                        .padding(.horizontal, 20)

                        Button {
                            startTimer()
                        } label: {
                            Text("Start Timer")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.black)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .background(Color.green)
                                .clipShape(RoundedRectangle(cornerRadius: 32))
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 8)
                    }
                }

                Spacer()
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
    }

    private func startTimer() {
        remaining = Double(selectedMinutes) * 60
        isActive = true
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            remaining -= 1
            if remaining <= 0 {
                player.pause()
                cancelTimer()
            }
        }
    }

    private func cancelTimer() {
        timer?.invalidate()
        timer = nil
        isActive = false
    }

    private func formatRemaining() -> String {
        let m = Int(remaining) / 60
        let s = Int(remaining) % 60
        return String(format: "%d:%02d", m, s)
    }
}
