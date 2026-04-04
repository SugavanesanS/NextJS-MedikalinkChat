'use client';
import { Icon } from "@iconify/react";
import { useCallback, useEffect, useRef } from "react";
import { useAudioRecorder } from "react-use-audio-recorder";
import i18n from "../services/i18next/i18next";


const RecorderComp = ({ onRecordStop, onStartRecording }: { onRecordStop: (blobUrl: string, blobFile: File, duration?: number) => void, onStartRecording?: () => void }) => {

    const { recordingStatus, recordingTime, startRecording, stopRecording, pauseRecording, resumeRecording } = useAudioRecorder(); // , getBlob, saveRecording
    const resetDuration = 1000 * 60 * 3 // 3 mins
    const recordTimer = useRef<NodeJS.Timeout | null>(null)
    const getRecordTimer = useCallback((secs: number) => {
        return secsToDurationString(secs)
    }, [])

    const onCloseCallback = () => {
        stopRecording((blob, blobUrl) => {
            if (!blob) return
            onRecordStop(blobUrl!, new File([blob!], blob.type, {
                type: blob.type,
                lastModified: Date.now()
            }), (recordingTime * 1000))
        })
    }

    useEffect(() => {
        return () => {
            if (!(recordingStatus == "recording" || recordingStatus == "paused")) return
            onCloseCallback()
        }
    }, [])

    return (
        <div className={'recorder-comp'} title={i18n.t('audio_recorder')}>
            {!(!recordingStatus || recordingStatus === "stopped") ?
                <div className="audio-recorder" >
                    {((recordingStatus === "paused") || (recordingStatus === "recording")) &&
                        <span className="pause-play">
                            <Icon icon={`line-md:${recordingStatus === "recording" ? "play-filled-to-pause" : "pause-to-play-filled"}-transition`} width="20" height="20"
                                onClick={() => {
                                    if (recordingStatus === "recording") {
                                        pauseRecording()
                                    } else {
                                        resumeRecording()
                                    }
                                }}
                            />
                        </span>}
                    <div className={`audio-bars ${recordingStatus === "paused" ? "paused" : ""}`}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <span key={i} style={{ animationDelay: `${i * 0.1}s` }} />
                        ))}
                    </div>
                    {(recordingStatus === "recording" || recordingStatus === "paused") &&
                        <Icon className="stop-rec" icon="solar:stop-bold" width="20" height="20"
                            onClick={() => {
                                stopRecording((blob, blobUrl) => {
                                    if (!blob) return
                                    onRecordStop(blobUrl!, new File([blob!], blob.type, {
                                        type: blob.type,
                                        lastModified: Date.now()
                                    }), (recordingTime * 1000))
                                })
                            }}
                        />
                    }
                    <p>{getRecordTimer(recordingTime) || '00:00'}</p>
                </div>
                :
                <Icon className="start-rec" icon="eva:mic-fill" width="20" height="20"
                    onClick={() => {
                        if (recordTimer.current) clearTimeout(recordTimer.current)
                        recordTimer.current = setTimeout(() => {
                            onCloseCallback()
                        }, resetDuration);
                        onStartRecording?.()
                        startRecording()
                    }} />
            }
        </div>
    )
}


export default RecorderComp