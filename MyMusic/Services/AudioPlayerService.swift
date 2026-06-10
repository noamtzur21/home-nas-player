import AVFoundation
import MediaPlayer
import Combine
import Observation

@Observable
final class AudioPlayerService: NSObject {
    private(set) var currentSong: Song?
    private(set) var isPlaying = false
    private(set) var currentTime: TimeInterval = 0
    private(set) var duration: TimeInterval = 0
    private(set) var volume: Float = 1.0
    private(set) var queue: [Song] = []
    private(set) var currentIndex: Int = 0
    var repeatMode: RepeatMode = .none
    var isShuffled = false

    var onSongStarted: ((Song) -> Void)?

    private var player: AVAudioPlayer?
    private var timer: Timer?

    enum RepeatMode {
        case none, one, all
    }

    override init() {
        super.init()
        setupAudioSession()
        setupRemoteCommandCenter()
    }

    // MARK: - Audio Session

    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, options: [.allowBluetoothHFP])
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Audio session error: \(error)")
        }
    }

    // MARK: - Playback Control

    func play(song: Song, in queue: [Song] = []) {
        let newQueue = queue.isEmpty ? [song] : queue
        self.queue = isShuffled ? newQueue.shuffled() : newQueue
        self.currentIndex = self.queue.firstIndex(where: { $0.id == song.id }) ?? 0
        loadAndPlay(song: song)
    }

    func togglePlayPause() {
        if isPlaying {
            pause()
        } else {
            resume()
        }
    }

    func pause() {
        player?.pause()
        isPlaying = false
        stopTimer()
        updateNowPlayingInfo()
    }

    func resume() {
        player?.play()
        isPlaying = true
        startTimer()
        updateNowPlayingInfo()
    }

    func next() {
        guard !queue.isEmpty else { return }
        switch repeatMode {
        case .one:
            seek(to: 0)
            resume()
        case .all:
            currentIndex = (currentIndex + 1) % queue.count
            loadAndPlay(song: queue[currentIndex])
        case .none:
            if currentIndex < queue.count - 1 {
                currentIndex += 1
                loadAndPlay(song: queue[currentIndex])
            } else {
                pause()
                seek(to: 0)
            }
        }
    }

    func previous() {
        if currentTime > 3 {
            seek(to: 0)
            return
        }
        guard !queue.isEmpty else { return }
        currentIndex = max(0, currentIndex - 1)
        loadAndPlay(song: queue[currentIndex])
    }

    func seek(to time: TimeInterval) {
        player?.currentTime = time
        currentTime = time
        updateNowPlayingInfo()
    }

    func setVolume(_ value: Float) {
        volume = value
        player?.volume = value
    }

    func toggleShuffle() {
        isShuffled.toggle()
        if isShuffled {
            let current = currentSong
            queue = queue.shuffled()
            if let current, let idx = queue.firstIndex(where: { $0.id == current.id }) {
                queue.swapAt(0, idx)
                currentIndex = 0
            }
        }
    }

    func toggleRepeat() {
        switch repeatMode {
        case .none: repeatMode = .all
        case .all: repeatMode = .one
        case .one: repeatMode = .none
        }
    }

    // MARK: - Queue Management

    func addToQueue(_ song: Song) {
        queue.append(song)
    }

    func removeFromQueue(at index: Int) {
        guard index < queue.count else { return }
        queue.remove(at: index)
        if index < currentIndex {
            currentIndex -= 1
        }
    }

    // MARK: - Private

    private func loadAndPlay(song: Song) {
        guard let url = song.fileURL else { return }
        do {
            player?.stop()
            player = try AVAudioPlayer(contentsOf: url)
            player?.delegate = self
            player?.volume = volume
            player?.prepareToPlay()
            player?.play()
            currentSong = song
            onSongStarted?(song)
            duration = player?.duration ?? 0
            currentTime = 0
            isPlaying = true
            startTimer()
            updateNowPlayingInfo()
        } catch {
            print("Failed to play \(song.title): \(error)")
        }
    }

    private func startTimer() {
        stopTimer()
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            self?.currentTime = self?.player?.currentTime ?? 0
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Now Playing Info (Lock Screen / CarPlay)

    private func setupRemoteCommandCenter() {
        let center = MPRemoteCommandCenter.shared()

        center.playCommand.addTarget { [weak self] _ in
            self?.resume()
            return .success
        }
        center.pauseCommand.addTarget { [weak self] _ in
            self?.pause()
            return .success
        }
        center.nextTrackCommand.addTarget { [weak self] _ in
            self?.next()
            return .success
        }
        center.previousTrackCommand.addTarget { [weak self] _ in
            self?.previous()
            return .success
        }
        center.changePlaybackPositionCommand.addTarget { [weak self] event in
            if let e = event as? MPChangePlaybackPositionCommandEvent {
                self?.seek(to: e.positionTime)
            }
            return .success
        }
    }

    private func updateNowPlayingInfo() {
        guard let song = currentSong else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
            return
        }
        var info: [String: Any] = [
            MPMediaItemPropertyTitle: song.title,
            MPMediaItemPropertyArtist: song.artist,
            MPMediaItemPropertyAlbumTitle: song.album,
            MPNowPlayingInfoPropertyElapsedPlaybackTime: currentTime,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: isPlaying ? 1.0 : 0.0
        ]
        if let artworkData = song.artworkData, let image = UIImage(data: artworkData) {
            info[MPMediaItemPropertyArtwork] = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
    }
}

extension AudioPlayerService: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if flag { next() }
    }
}
