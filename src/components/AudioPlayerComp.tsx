'use client';
import { useEffect, useRef, useState } from "react";
import { secsToDurationString } from "../services/CommonFunction"

const AudioPlayerComp = ({ uri, name, id }: { uri: string, name: string, id: string }) => {
    const { toggleAudio, time, setCurrentTime, isPlaying, duration } = useAudio({
        src: uri,
        id: id,
    });

    return (
        <>
            <div className="msg-preview"
                onClick={toggleAudio}>
                <div className={`icon-wrapper d-flex ${isPlaying ? "play" : "paused"}`}
                >
                    <span className="iconify" />
                </div>
            </div>
            <div className="audio-player" >
                {/* <span className="msg-att-name">{name || 'REC_AUDIO'}</span> */}
                <input
                    className="player-bar-wrapper w-full "
                    type="range"
                    min="0"
                    value={time}
                    step={0.1}
                    max={duration}
                    onChange={(e) => {
                        const val = +e.target.value;
                        setCurrentTime(val);
                    }}
                />
                {/* <div className="player-bar-wrapper">
                    <span className="player-bar" style={{ width: `${(time / (duration || 0)) * 100}%` }} />
                </div> */}
                <span className="player-time" style={{ fontSize: 10 }} children={!isPlaying ? secsToDurationString(duration) : secsToDurationString(time)} />
            </div>
        </>
    )
}

export default AudioPlayerComp


export class AudioSingleton {
    private static instance: Record<string, HTMLAudioElement> = {};
    private constructor() { }

    public static getInstance(id: string): any {
        if (!AudioSingleton.instance[id]) {
            AudioSingleton.instance[id] = new Audio();
        }
        return AudioSingleton.instance[id];
    }

    public static pauseAllAudioExcept(id: string): void {
        Object.entries(this.instance).map(([key, value]) => {
            if (key !== id) {
                value.pause();
            }
        });
    }
    // 🔹 Clear a specific instance
    public static destroyInstance(id: string): void {
        const audio = AudioSingleton.instance[id];
        if (audio) {
            audio.pause();
            audio.src = "";  // release resource
            delete AudioSingleton.instance[id]; // remove reference
        }
    }

    // 🔹 Clear all instances (optional helper)
    public static destroyAll(): void {
        Object.keys(AudioSingleton.instance).forEach((id) => {
            this.destroyInstance(id);
        });
    }
}

export function useAudio({ src = "", id }: { src?: string; id: string }): {
    toggleAudio: () => void;
    time: number;
    setCurrentTime: (time: number) => void;
    isPlaying: boolean;
    duration: number;
} {
    const [time, setTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const audio = AudioSingleton.getInstance(id);
    const controllerRef = useRef<HTMLAudioElement>();


    const handleTimeUpdate = (time: number) => {
        setTime(time);
    };

    const handleEvent = (e: Event) => {
        switch (e.type) {
            case "timeupdate": {
                const newTime = Math.floor(controllerRef.current?.currentTime || 0);
                handleTimeUpdate(newTime);
                break;
            }
            case "ended": {
                setTime(0);
                break;
            }
            case "play": {
                setIsPlaying(true);
                AudioSingleton.pauseAllAudioExcept(id);

                break;
            }
            case "pause": {
                setIsPlaying(false);
                break;
            }
            case "loadeddata": {
                setDuration(audio.duration);
            }

            default:
                break;
        }
    };


    const handleSetAudioHandler = () => {
        audio.addEventListener("timeupdate", handleEvent);
        audio.addEventListener("play", handleEvent);
        audio.addEventListener("pause", handleEvent);
        audio.addEventListener("loadstart", handleEvent);
        audio.addEventListener("loadeddata", handleEvent);
        audio.addEventListener("playing", handleEvent);
        audio.addEventListener("ended", handleEvent);
    };

    const handleRemoveAudioHandler = () => {
        audio.removeEventListener("timeupdate", handleEvent);
        audio.removeEventListener("play", handleEvent);
        audio.removeEventListener("pause", handleEvent);
        audio.removeEventListener("loadstart", handleEvent);
        audio.removeEventListener("loadeddata", handleEvent);
        audio.removeEventListener("playing", handleEvent);
        audio.removeEventListener("ended", handleEvent);
    };

    useEffect(() => {
        if (!audio.paused) {
            setIsPlaying(true);
        }
        controllerRef.current = audio;
        if (audio.currentTime !== 0) {
            setTime(audio.currentTime);
            setDuration(audio.duration);
        }
        handleSetAudioHandler();
    }, []);

    useEffect(() => {
        if (audio.paused && controllerRef.current && audio.currentTime === 0)
            controllerRef.current.src = src;
    }, [src]);

    useEffect(() => {
        return () => {
            handleRemoveAudioHandler();
        };
    }, []);

    const toggleAudio = () => {
        if (audio.paused) {
            controllerRef.current?.play();
        } else {
            controllerRef.current?.pause();
        }
    };

    const setCurrentTime = (time: number) => {
        setTime(time);
        if (controllerRef.current) controllerRef.current.currentTime = time;
    };

    return { toggleAudio, time, setCurrentTime, isPlaying, duration };
}