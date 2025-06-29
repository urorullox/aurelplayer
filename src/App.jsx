import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Heart,
  X,
  Music
} from "lucide-react";

// Data album dengan path lokal untuk gambar cover dan judul lagu
const albums = [
  {
    title: "Hivi!",
    cover: "/albums/hivi.jpg",
    songs: ["Pelangi", "Remaja", "Siapkah Kau Tuk Jatuh Cinta Lagi"],
    color: "from-purple-600 to-pink-600"
  },
  {
    title: "Jennie",
    cover: "/albums/jennie.jpg",
    songs: ["You & Me", "Solo"],
    color: "from-pink-500 to-rose-500"
  },
  {
    title: "Ariana Grande",
    cover: "/albums/ariana.jpg",
    songs: ["Into You", "Positions", "No Tears Left To Cry", "Dangerous Woman"],
    color: "from-violet-500 to-purple-600"
  },
  {
    title: "Banda Neira",
    cover: "/albums/banda.jpg",
    songs: ["Sampai Jadi Debu", "Yang Patah Tumbuh"],
    color: "from-indigo-500 to-purple-500"
  },
  {
    title: "Nadin Amizah",
    cover: "/albums/nadin.jpg",
    songs: ["Bertaut", "Amin Paling Serius"],
    color: "from-pink-400 to-rose-400"
  },
  {
    title: "For You",
    cover: "/albums/foryou.jpg",
    songs: [
      "Nothing - Bruno Major",
      "The Most Beautiful Thing",
      "Best Part",
      "Favorite Girl",
      "Sanctuary",
      "Mine - Petra Sihombing",
      "One Call Away",
      "Waiting Room",
      "I'm Yours",
      "Out of My League",
      "The Only Exception"
    ],
    color: "from-rose-500 to-pink-500"
  }
];

// Helper components
const VolumeGestureArea = ({ volume, onVolumeChange, isMuted }) => (
  <div 
    className="volume-gesture-area w-full h-40 relative cursor-pointer touch-action-none"
    onTouchMove={onVolumeChange}
    onMouseMove={onVolumeChange}
  >
    <div 
      className="volume-indicator"
      style={{ height: `${isMuted ? 0 : volume}%` }}
    />
    <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-3xl pointer-events-none">
      {isMuted ? '🔇' : Math.round(volume)}
    </div>
  </div>
);


export default function MusicPlayer() {
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [shuffleMode, setShuffleMode] = useState('off'); // 'off', 'album', 'global'
  const [isLoop, setIsLoop] = useState(false);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [liked, setLiked] = useState(new Set());
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [totalTime, setTotalTime] = useState("0:00");
  const audioRef = useRef(null);
  
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(75);
  const [isVibrating, setIsVibrating] = useState(false);
  const [equalizerData, setEqualizerData] = useState(Array(12).fill(0));

  const allSongs = albums.flatMap((album) =>
    album.songs.map((song) => ({ songTitle: song, album: album }))
  );

  const showMessage = useCallback((text) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2500);
  }, []);

  const playSong = useCallback((album, index) => {
    if (album && album.songs && album.songs[index]) {
        setSelectedAlbum(album);
        setCurrentIndex(index);
        setNowPlaying(album.songs[index]);
        setIsPlaying(true);
        setProgress(0);
    }
  }, []);

  const nextSong = useCallback(() => {
    if (shuffleMode === 'global') {
        const randomSongIndex = Math.floor(Math.random() * allSongs.length);
        const { songTitle, album } = allSongs[randomSongIndex];
        const songIndexInAlbum = album.songs.indexOf(songTitle);
        playSong(album, songIndexInAlbum);
        return;
    }
    
    // FIX: Get current album from `nowPlaying` instead of `selectedAlbum`
    const albumToPlayFrom = albums.find(a => a.songs.includes(nowPlaying));
    if (!albumToPlayFrom) {
        playSong(albums[0], 0);
        return;
    }

    if (shuffleMode === 'album') {
        const nextIndex = Math.floor(Math.random() * albumToPlayFrom.songs.length);
        playSong(albumToPlayFrom, nextIndex);
    } else {
        const currentIdx = albumToPlayFrom.songs.indexOf(nowPlaying);
        const nextIndex = currentIdx + 1;
        if (nextIndex >= albumToPlayFrom.songs.length) {
            if (isLoop) {
                playSong(albumToPlayFrom, 0);
            } else {
                const currentAlbumIndex = albums.findIndex((a) => a.title === albumToPlayFrom.title);
                const nextAlbum = albums[(currentAlbumIndex + 1) % albums.length];
                playSong(nextAlbum, 0);
                showMessage(`Memutar album ${nextAlbum.title}`);
            }
        } else {
            playSong(albumToPlayFrom, nextIndex);
        }
    }
  }, [nowPlaying, shuffleMode, isLoop, playSong, showMessage, allSongs]);

  const prevSong = useCallback(() => {
    // FIX: Get current album from `nowPlaying`
    const albumToPlayFrom = albums.find(a => a.songs.includes(nowPlaying));
    if (!albumToPlayFrom) return;
    const currentIdx = albumToPlayFrom.songs.indexOf(nowPlaying);
    const prevIndex = currentIdx === 0 ? albumToPlayFrom.songs.length - 1 : currentIdx - 1;
    playSong(albumToPlayFrom, prevIndex);
  }, [nowPlaying, playSong]);
    
  const togglePlayPause = () => {
    if (!nowPlaying) {
        playSong(albums[0], 0);
    } else {
        setIsPlaying(!isPlaying);
    }
  };

  const toggleShuffle = useCallback((mode) => { // mode: 'global' atau 'album'
    setShuffleMode(prev => {
        const newMode = prev === mode ? 'off' : mode;
        if (newMode !== 'off') {
            setIsLoop(false);
            if (newMode === 'global') {
              const randomSongIndex = Math.floor(Math.random() * allSongs.length);
              const { songTitle, album } = allSongs[randomSongIndex];
              const songIndexInAlbum = album.songs.indexOf(songTitle);
              playSong(album, songIndexInAlbum);
              showMessage("✨ Mengacak semua lagu");
            } else if (selectedAlbum) {
              const random = Math.floor(Math.random() * selectedAlbum.songs.length);
              playSong(selectedAlbum, random);
              showMessage(`🔀 Mengacak album ${selectedAlbum.title}`);
            }
        } else {
            showMessage("🔀 Mode acak dimatikan");
        }
        return newMode;
    });
  }, [allSongs, selectedAlbum, playSong, showMessage]);

  const toggleLoop = useCallback(() => {
    setIsLoop(prev => {
        const willBeLoop = !prev;
        if (willBeLoop) {
          setShuffleMode('off');
          if (nowPlaying) showMessage(`🔁 Mengulang ${nowPlaying}`);
        } else {
          showMessage("🔁 Mode ulang dimatikan");
        }
        return willBeLoop;
    });
  }, [nowPlaying, showMessage]);

  const toggleLike = useCallback((songTitle) => {
    setLiked(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(songTitle)) {
        newLiked.delete(songTitle);
        showMessage("💔 Dihapus dari favorit");
      } else {
        newLiked.add(songTitle);
        showMessage("💖 Ditambahkan ke favorit");
      }
      return newLiked;
    });
  }, [showMessage]);

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e) => {
      const newProgress = e.target.value;
      setProgress(newProgress);
      if (audioRef.current && audioRef.current.duration) {
          audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      }
  };

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && nowPlaying) {
      nextSong();
      vibrate();
    }
    if (isRightSwipe && nowPlaying) {
      prevSong();
      vibrate();
    }
  };
  
  const vibrate = () => {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setIsVibrating(true);
    setTimeout(() => setIsVibrating(false), 100);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(previousVolume);
      setIsMuted(false);
    } else {
      setPreviousVolume(volume);
      setVolume(0);
      setIsMuted(true);
    }
    vibrate();
  };
  
  const handleVolumeGesture = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const height = rect.height;
    const relativeY = (rect.bottom - y) / height;
    const newVolume = Math.max(0, Math.min(100, relativeY * 100));
    setVolume(Math.round(newVolume));
    setIsMuted(false);
    vibrate();
  };

  const handleSlideStart = () => setIsSliding(true);
  const handleSlideEnd = () => setIsSliding(false);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [volume]);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (isPlaying) audioRef.current.play().catch(console.error);
      else audioRef.current.pause();
    }
  }, [isPlaying, nowPlaying, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => { if (!isSliding && audio.duration) { setProgress((audio.currentTime / audio.duration) * 100); setCurrentTime(formatTime(audio.currentTime)); } };
    const handleLoadedMetadata = () => setTotalTime(formatTime(audio.duration));
    const handleEnded = () => nextSong();
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [isSliding, nextSong]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setEqualizerData(prev => 
          prev.map(() => Math.random() * 80 + 20)
        );
      }, 200);
    } else {
      setEqualizerData(Array(12).fill(5));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  const isAlbumPlaying = isPlaying && selectedAlbum?.songs.includes(nowPlaying);
  
  // FIX: Derive current playing album info directly from nowPlaying song
  const currentPlayingAlbumInfo = nowPlaying 
    ? allSongs.find(s => s.songTitle === nowPlaying)?.album 
    : null;


  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-black via-pink-900 to-purple-900 text-white font-sans relative overflow-hidden pb-48 select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => ( <div key={i} className="absolute w-2 h-2 bg-pink-400 rounded-full opacity-20 animate-pulse" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 2}s` }} /> ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <div className="text-center transform -rotate-12">
          <div className="text-8xl md:text-9xl font-serif italic text-pink-300 mb-2" style={{fontFamily: 'Brush Script MT, cursive'}}> Aurel </div>
          <div className="text-2xl text-pink-400 font-light tracking-widest"> by jess.edit </div>
        </div>
      </div>

      <div className="relative z-10 p-4 md:p-6">
        {/* Profile Section */}
        <div className="flex items-center gap-4 mb-8 group animate-float">
          <div className="relative">
            <img 
              src="/profile.jpg" 
              alt="Profile" 
              className="w-16 h-16 rounded-full shadow-lg border-3 border-pink-300 transition-all duration-300 group-hover:scale-110 group-hover:shadow-pink-500/50" 
            />
            {isPlaying && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center animate-heartbeat">
                <Music size={12} className="text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white transition-all duration-300 group-hover:text-pink-300 text-responsive"> 
              Aurel Kyhand Diva Ramadani 
            </h1>
            <p className="text-sm text-pink-200 opacity-80">by Jess with Love</p>
          </div>
        </div>


        {/* Global Controls */}
        {!selectedAlbum && (
          <div className="flex gap-4 mb-8 justify-center">
            <button aria-label="Acak semua lagu" onClick={() => toggleShuffle('global')} className={`group relative rounded-full p-5 transition-all duration-300 transform hover:scale-110 active:scale-95 ${ shuffleMode === 'global' ? "bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-pink-500/50" : "bg-white/10 hover:bg-white/20" } text-white backdrop-blur-sm`}>
              <Shuffle className="transition-transform duration-300 group-hover:rotate-12" />
            </button>
            <button aria-label="Ulangi lagu" onClick={toggleLoop} className={`group relative rounded-full p-5 transition-all duration-300 transform hover:scale-110 active:scale-95 ${ isLoop ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50" : "bg-white/10 hover:bg-white/20" } text-white backdrop-blur-sm`}>
              <Repeat className="transition-transform duration-300 group-hover:rotate-180" />
            </button>
          </div>
        )}

        {/* Album Grid / Song List */}
        <div className="transition-all duration-500 ease-in-out">
          {!selectedAlbum ? (
            <div>
              <h2 className="text-2xl font-bold mb-4 text-pink-200">Album</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-6 mobile-optimized">
                {albums.map((album, idx) => (
                  <div 
                    key={idx} 
                    className="group touch-target" 
                    onClick={() => {
                      setSelectedAlbum(album);
                      vibrate();
                    }}
                  >
                    <div className="relative overflow-hidden rounded-xl">
                      <img 
                        src={album.cover} 
                        alt={album.title} 
                        className="w-full aspect-square rounded-xl shadow-lg object-cover mb-2 transition-all duration-300 group-hover:scale-105 group-active:scale-95" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-xs text-white font-medium">{album.songs.length} lagu</div>
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm text-white truncate text-responsive mt-2">{album.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="animate-slide-in">
              <button className="mb-6 text-sm text-pink-300 hover:text-white transition-colors duration-300 flex items-center gap-2 group" onClick={() => setSelectedAlbum(null)}>
                <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span> Kembali
              </button>
              <div className="flex items-center gap-5 mb-6">
                <img src={selectedAlbum.cover} alt={selectedAlbum.title} className="w-28 h-28 md:w-32 md:h-32 rounded-xl shadow-lg" />
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold">{selectedAlbum.title}</h2>
                  <p className="text-sm text-pink-200 opacity-80 mt-1">Daftar Lagu</p>
                  <div className="flex gap-4 mt-4">
                    <button onClick={isAlbumPlaying ? togglePlayPause : () => playSong(selectedAlbum, 0)} className="bg-pink-500 text-white rounded-full p-4 shadow-lg hover:scale-105 active:scale-95 transition-transform">
                        {isAlbumPlaying ? <Pause /> : <Play className="translate-x-0.5" />}
                    </button>
                    <button onClick={() => toggleShuffle('album')} className={`rounded-full p-4 transition-all ${ shuffleMode === 'album' ? 'text-pink-400' : 'text-white/70' } hover:text-white`}><Shuffle /></button>
                    <button onClick={toggleLoop} className={`rounded-full p-4 transition-all ${ isLoop ? 'text-pink-400' : 'text-white/70' } hover:text-white`}><Repeat /></button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {selectedAlbum.songs.map((song, i) => (
                  <div key={i} onClick={() => playSong(selectedAlbum, i)} className={`group bg-white/5 rounded-xl p-4 flex items-center gap-4 transition-all duration-200 ${ nowPlaying === song ? 'bg-pink-500/20' : 'hover:bg-white/10 active:bg-white/5' }`}>
                    <div className="text-pink-300 font-mono text-sm opacity-60 w-6 text-center"> {nowPlaying === song && isPlaying ? <Pause size={16} className="mx-auto" /> : String(i + 1)} </div>
                    <div className="flex-1">
                      <p className="font-medium text-white truncate">{song}</p>
                      <p className="text-xs text-pink-200 opacity-60">{selectedAlbum.title}</p>
                    </div>
                    <button aria-label="Sukai lagu" onClick={(e) => { e.stopPropagation(); toggleLike(song); }} className={`p-2 rounded-full transition-all duration-300 ${ liked.has(song) ? "text-pink-500" : "text-gray-400 opacity-0 group-hover:opacity-100" }`}>
                      <Heart size={18} className={liked.has(song) ? "fill-current" : ""} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {message && ( <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-lg px-6 py-3 rounded-full text-sm text-white shadow-lg z-50 border border-white/10 animate-bounce-in"> {message} </div> )}

      {/* Volume Modal */}
      {showVolumeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center" onClick={() => setShowVolumeModal(false)}>
          <div className="glass-effect rounded-2xl p-6 w-80 animate-bounce-in mobile-optimized" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">Volume Control</h3>
              <button 
                onClick={() => {
                  setShowVolumeModal(false);
                  vibrate();
                }} 
                className="p-2 rounded-full hover:bg-white/10 touch-target"
              >
                <X size={20} />
              </button>
            </div>
            
            <VolumeGestureArea 
              volume={volume}
              onVolumeChange={handleVolumeGesture}
              isMuted={isMuted}
            />
            
            <div className="mt-4 space-y-4">
              <input 
                type="range" 
                className="mobile-slider w-full" 
                min="0" 
                max="100" 
                value={isMuted ? 0 : volume} 
                onChange={(e) => {
                  setVolume(e.target.value);
                  setIsMuted(false);
                }} 
              />
              
              <div className="flex justify-between items-center">
                <button
                  onClick={toggleMute}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 rounded-full hover:bg-pink-500/30 transition-colors touch-target"
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  <span className="text-sm">{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                
                <div className="text-right">
                  <div className="text-2xl font-bold">{isMuted ? '🔇' : Math.round(volume)}</div>
                  <div className="text-xs opacity-70">Volume</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Player */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-xl z-30">
        <div className="p-4 space-y-3">
            <div className="flex items-center gap-4">
                <img src={nowPlaying ? currentPlayingAlbumInfo?.cover : "/albums/placeholder.jpg"} alt={nowPlaying ? currentPlayingAlbumInfo?.title : "Tidak ada musik"} className={`w-14 h-14 rounded-lg bg-gray-800 transition-all duration-300 ${isPlaying ? 'animate-pulse-glow' : ''}`} />
                <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-white truncate">{nowPlaying || "Belum ada lagu"}</p>
                    <p className="text-sm text-pink-200 opacity-80 truncate">{nowPlaying ? currentPlayingAlbumInfo?.title : "Pilih dari daftar album"}</p>
                </div>
                <button aria-label="Sukai lagu" onClick={() => nowPlaying && toggleLike(nowPlaying)} className={`p-3 rounded-full transition-all ${ liked.has(nowPlaying) ? "text-pink-500" : "text-gray-400" } ${!nowPlaying && 'opacity-50 cursor-not-allowed'}`} disabled={!nowPlaying} >
                  <Heart size={22} className={liked.has(nowPlaying) ? "fill-current" : ""} />
                </button>
            </div>
            
            <div className="space-y-1">
              <div className="w-full group relative py-3 touch-action-none">
                <div className={`minimalist-equalizer-container ${isPlaying ? 'playing' : ''}`}>
                  {equalizerData.map((height, index) => (
                    <div
                      key={index}
                      className="minimalist-bar"
                      style={{
                        height: `${height}%`,
                        animationDelay: `${index * 0.08}s`
                      }}
                    />
                  ))}
                </div>
                
                <div className="progress-container mt-3">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${progress || 0}%` }}
                  />
                  <input 
                    type="range" 
                    aria-label="Progress lagu" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    min="0" 
                    max="100" 
                    value={progress || 0} 
                    onChange={handleProgressChange} 
                    onMouseDown={handleSlideStart} 
                    onMouseUp={handleSlideEnd} 
                    onTouchStart={handleSlideStart} 
                    onTouchEnd={handleSlideEnd} 
                    disabled={!nowPlaying} 
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-pink-300 opacity-80"> 
                <span>{nowPlaying ? currentTime : '0:00'}</span> 
                <span>{nowPlaying ? totalTime : '0:00'}</span> 
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button 
                aria-label="Pengaturan volume" 
                onClick={() => {
                  setShowVolumeModal(true);
                  vibrate();
                }} 
                className={`p-3 text-pink-300 hover:text-white touch-target transition-all ${isVibrating ? 'animate-ripple' : ''}`}
              > 
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              
              <div className="flex items-center gap-4">
                <button 
                  aria-label="Lagu sebelumnya" 
                  onClick={() => {
                    prevSong();
                    vibrate();
                  }} 
                  className={`p-3 text-pink-300 hover:text-white active:scale-90 transition-transform touch-target ${!nowPlaying && 'opacity-50 cursor-not-allowed'}`} 
                  disabled={!nowPlaying}
                > 
                  <SkipBack size={28} /> 
                </button>
                
                <button 
                  aria-label={isPlaying ? 'Jeda' : 'Putar'} 
                  onClick={() => {
                    togglePlayPause();
                    vibrate();
                  }} 
                  className={`bg-pink-500 text-white p-5 rounded-full shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-transform touch-target ${isVibrating ? 'btn-press' : ''}`}
                >
                  {isPlaying ? <Pause size={32} /> : <Play size={32} className="translate-x-0.5" /> }
                </button>
                
                <button 
                  aria-label="Lagu berikutnya" 
                  onClick={() => {
                    nextSong();
                    vibrate();
                  }} 
                  className={`p-3 text-pink-300 hover:text-white active:scale-90 transition-transform touch-target ${!nowPlaying && 'opacity-50 cursor-not-allowed'}`} 
                  disabled={!nowPlaying}
                > 
                  <SkipForward size={28} /> 
                </button>
              </div>
              
              <div className="w-11"></div>
            </div>
        </div>
      </div>
      
      <style>{`
        /* Minimalist Equalizer Container */
        .minimalist-equalizer-container { display: flex; align-items: end; justify-content: space-between; height: 32px; padding: 0 8px; gap: 3px; background: rgba(255, 255, 255, 0.02); border-radius: 6px; backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.05); }
        .minimalist-bar { background: linear-gradient(to top, rgba(255, 255, 255, 0.3), rgba(236, 72, 153, 0.4), rgba(255, 255, 255, 0.6)); border-radius: 1px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); min-height: 2px; width: 2px; opacity: 0.8; box-shadow: 0 0 3px rgba(236, 72, 153, 0.2); }
        @keyframes minimalist-wave { 0%, 100% { transform: scaleY(0.3); opacity: 0.6; } 50% { transform: scaleY(1); opacity: 1; } }
        .minimalist-equalizer-container.playing .minimalist-bar { animation: minimalist-wave 1.8s ease-in-out infinite; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(1) { animation-delay: 0s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(2) { animation-delay: 0.1s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(3) { animation-delay: 0.2s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(4) { animation-delay: 0.3s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(5) { animation-delay: 0.4s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(6) { animation-delay: 0.5s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(7) { animation-delay: 0.4s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(8) { animation-delay: 0.3s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(9) { animation-delay: 0.2s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(10) { animation-delay: 0.1s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(11) { animation-delay: 0.2s; }
        .minimalist-equalizer-container.playing .minimalist-bar:nth-child(12) { animation-delay: 0.3s; }
        .minimalist-equalizer-container:hover .minimalist-bar { opacity: 1; box-shadow: 0 0 6px rgba(236, 72, 153, 0.4); }
        .minimalist-equalizer-container:not(.playing) .minimalist-bar { background: linear-gradient(to top, rgba(255, 255, 255, 0.1), rgba(236, 72, 153, 0.2), rgba(255, 255, 255, 0.3)); opacity: 0.4; }
        
        /* Mobile Touch Optimizations */
        .touch-action-none { touch-action: none; }
        .select-none { user-select: none; -webkit-user-select: none; }
        
        /* Enhanced Animations */
        @keyframes ripple { 0% { transform: scale(0); opacity: 1; } 100% { transform: scale(4); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-heartbeat { animation: heartbeat 1.5s ease-in-out infinite; }
        .animate-ripple { animation: ripple 0.6s ease-out; }
        
        /* Improved Mobile Sliders */
        .mobile-slider { -webkit-appearance: none; width: 100%; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; outline: none; position: relative; }
        .mobile-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #ec4899; border-radius: 50%; cursor: pointer; box-shadow: 0 2px 10px rgba(236, 72, 153, 0.5); transition: all 0.2s ease; }
        .mobile-slider:active::-webkit-slider-thumb { transform: scale(1.3); box-shadow: 0 4px 20px rgba(236, 72, 153, 0.8); }
        
        /* Volume Gesture Area */
        .volume-gesture-area { background: linear-gradient(to top, rgba(236, 72, 153, 0.8) 0%, rgba(236, 72, 153, 0.4) 50%, rgba(236, 72, 153, 0.1) 100%); border-radius: 10px; position: relative; overflow: hidden; }
        .volume-indicator { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(236, 72, 153, 0.6); transition: height 0.1s ease-out; border-radius: 0 0 10px 10px; }
        
        /* Button Press Effects */
        .btn-press { transform: scale(0.95); box-shadow: inset 0 2px 4px rgba(0,0,0,0.3); }
        
        /* Enhanced Glassmorphism */
        .glass-effect { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }
        
        /* Improved Progress Bar */
        .progress-container { position: relative; height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #ec4899, #f97316); border-radius: 3px; transition: width 0.1s ease-out; position: relative; }
        .progress-fill::after { content: ''; position: absolute; top: 0; right: 0; width: 4px; height: 100%; background: rgba(255,255,255,0.8); border-radius: 2px; box-shadow: 0 0 10px rgba(255,255,255,0.5); }
        
        /* Mobile-specific media queries */
        @media (max-width: 640px) {
          .mobile-optimized { padding: 12px; }
          .touch-target { min-width: 44px; min-height: 44px; }
          .text-responsive { font-size: clamp(0.875rem, 2.5vw, 1rem); }
        }
        
        /* Reduced motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .animate-float, .animate-heartbeat, .animate-ripple, .minimalist-bar { animation: none; }
        }

        /* Existing Styles */
        @keyframes slide-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce-in { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 8px rgba(236, 72, 153, 0.4); } 50% { box-shadow: 0 0 20px rgba(236, 72, 153, 0.8); } }
        .animate-slide-in { animation: slide-in 0.5s ease-out forwards; }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out forwards; }
        .animate-pulse-glow { animation: pulse-glow 2.5s infinite ease-in-out; }
      `}</style>
      <audio ref={audioRef} src={nowPlaying ? `/songs/${nowPlaying}.mp3` : ''} preload="auto" onCanPlay={() => { if(isPlaying) audioRef.current.play() }} />
    </div>
  );
}
