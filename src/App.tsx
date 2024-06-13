/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { generateVideoThumbnails } from "@rajesh896/video-thumbnails-generator";
import localforage, { INDEXEDDB } from "localforage";
import { Duration } from "luxon";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import WaveSurfer from "wavesurfer.js";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Progress } from "./components/ui/progress";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import { IVideo, useVideoStore } from "./stores/videoStore";
// import SyncerW from './workers/app.worker';

function App() {
  // const syncerWorker = useMemo(() => new Worker(SyncerW), []);

  // useEffect(() => {
  //   return () =>  {
  //     syncerWorker.terminate();
  //   }
  // },[]);
  const myWorker = new Worker("app.worker.js");

  const { toast } = useToast();
  const { setUploadedVideos } = useVideoStore();
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [videoURL, setVideoURL] = useState("");
  const [file, setFile] = useState<File>();
  const [isTranscoded, setIsTranscoded] = useState(false);
  const [isTranscoding, setIsTranscoding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0); //seconds
  const [audioBase64, setAudioBase64] = useState<
    string | ArrayBuffer | Blob | null
  >();
  const [videoBase64, setVideoBase64] = useState<
    string | ArrayBuffer | Blob | null
  >();
  const [thumbnail, setThumbnail] = useState<string>();
  const [peaks, setPeaks] = useState<(Float32Array | number[])[]>();
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const [transcodedData, setTranscodedData] = useState<IVideo>({
    id: "",
    video_url: "",
    audio_url: "",
    file_name: "input.mp3",
    source_file_type: "video/mp4",
    created_at: "",
    video_base64: "",
    audio_base64: "",
    thumbnail: "",
  });
  const waveformRef = useRef<any>(null);
  // const { handleChunkVideo } = useVideoChunk(); // TODO: call this if the video is ready for s3 upload

  const load = async () => {
    // const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
    });

    ffmpeg.on("progress", ({ progress }) => {
      if (progress <= 1) {
        setProgress(Math.ceil(Math.abs(progress) * 100));
      }
    });

    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await ffmpeg.load({
      coreURL: await toBlobURL(`ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`ffmpeg-core.wasm`, "application/wasm"),
      workerURL: await toBlobURL(`ffmpeg-core.worker.js`, "text/javascript"),
    });
    setLoaded(true);
  };

  function blobToBase64(blob: any) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  const transcode = async () => {
    // if (file && file.type === "audio/mp3") return
    setIsTranscoding(true);
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL));
    await ffmpeg.exec([
      "-i",
      "input.mp4",
      "-af",
      "highpass=f=200, lowpass=f=3000, afftdn=nf=-80:rf=-80",
      "-b:a",
      "64k",
      "output.mp3",
    ]);
    const fileData = await ffmpeg.readFile("output.mp3");
    const data = new Uint8Array(fileData as ArrayBuffer);
    const audioBlob = new Blob([data.buffer], { type: "audio/mp3" });
    const videoBlob = new Blob([file!], { type: file?.type || "video/mp4" });

    if (videoRef.current) {
      const audioURL = URL.createObjectURL(
        new Blob([data.buffer], { type: "audio/mp3" })
      );

      // const downloadLink = document.createElement("a");
      // downloadLink.href = audioURL;
      // downloadLink.download = "output.mp3";
      // document.body.appendChild(downloadLink);
      // downloadLink.click();
      // document.body.removeChild(downloadLink);

      setAudioBase64(audioBlob);
      setVideoBase64(videoBlob);

      blobToBase64(audioBlob).then((value: any) => {
        window.opener.postMessage(JSON.stringify({ audio: value }), "*");
        window.close();
      });

      // blobToBase64(audioBlob).then((value: any) => {
      //   console.log("Audio", value);
      // });

      // blobToBase64(videoBlob).then((value: any) => {
      //   console.log("VIDEO", value);
      // });

      // videoRef.current.src = audioURL;

      // video file reader instance
      // const videoReader = new FileReader();
      // videoReader.readAsDataURL(videoBlob);
      // videoReader.addEventListener("load", (e: ProgressEvent<FileReader>) => {
      //   setVideoBase64(e.target?.result);
      // });

      //audio file reader instance
      const audioReader = new FileReader();
      audioReader.readAsDataURL(audioBlob);
      audioReader.addEventListener("load", () => {});

      if (file) {
        generateVideoThumbnails(file, 2, "file").then((res: string[]) => {
          setThumbnail(res[1]);
        });
      }

      setTranscodedData({
        id: uuidv4(),
        video_url: videoURL,
        audio_url: audioURL,
        file_name: file?.name || "input.mp3",
        source_file_type: file?.type || "video/mp4",
        created_at: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    if (!loaded) {
      load(); //load ffmpeg
    }

    return () => {
      ffmpegRef.current.terminate();
      setLoaded(false);
    };
  }, []);

  useEffect(() => {
    myWorker.onmessage = (event) => {
      console.log({ crossOriginIsolated: event.data });
    };
  }, [myWorker]);

  useEffect(() => {
    localforage.setDriver(INDEXEDDB);
    localforage
      .getItem("files")
      .then((value: any) => {
        if (value) {
          if (value.length > 0) {
            setUploadedVideos(value);
          } else {
            setUploadedVideos([]);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const getPeaks = async () => {
    const peaks = await fetch("sample_peak.json");
    const response = await peaks.json();
    setPeaks(response.data);
    // const chunkedVideo = await handleChunkVideo(file!);     // function for video chunking
    // if (chunkedVideo) {
    //   setVideoBase64(chunkedVideo.video_base64);
    // }
  };

  useEffect(() => {
    if (videoBase64) {
      setTranscodedData((prev) => {
        return {
          ...prev,
          video_base64: videoBase64,
          // audio_base64: audioBase64,
          // thumbnail: thumbnail,
        };
      });
    }
  }, [videoBase64]);

  useEffect(() => {
    if (audioBase64) {
      getPeaks();
      setTranscodedData((prev) => {
        return {
          ...prev,
          // video_base64: videoBase64,
          audio_base64: audioBase64,
          // thumbnail: thumbnail,
        };
      });
      setIsTranscoded(true);
      toast({
        variant: "success",
        title: "Success",
        description: "Video transcoded successfully",
      });
      setIsTranscoding(false);

      // localforage.setDriver(INDEXEDDB);

      // UploadFile(audioBase64)
      //   .then((_) => {
      //     localforage
      //       .getItem("files")
      //       .then((value: any) => {
      //         if (value) {
      //           if (value.length > 0) {
      //             localforage.setItem("files", [
      //               ...value,
      //               {
      //                 ...transcodedData,
      //                 video_base64: videoBase64,
      //                 audio_base64: audioBase64,
      //                 thumbnail: thumbnail,
      //               },
      //             ]);
      //             setUploadedVideos([
      //               ...value,
      //               {
      //                 ...transcodedData,
      //                 video_base64: videoBase64,
      //                 audio_base64: audioBase64,
      //                 thumbnail: thumbnail,
      //               },
      //             ]);
      //           } else {
      //             localforage.setItem("files", [
      //               {
      //                 ...transcodedData,
      //                 video_base64: videoBase64,
      //                 audio_base64: audioBase64,
      //                 thumbnail: thumbnail,
      //               },
      //             ]);
      //             setUploadedVideos([
      //               {
      //                 ...transcodedData,
      //                 video_base64: videoBase64,
      //                 audio_base64: audioBase64,
      //                 thumbnail: thumbnail,
      //               },
      //             ]);
      //           }
      //         } else {
      //           localforage.setItem("files", [
      //             {
      //               ...transcodedData,
      //               video_base64: videoBase64,
      //               audio_base64: audioBase64,
      //               thumbnail: thumbnail,
      //             },
      //           ]);
      //           setUploadedVideos([
      //             {
      //               ...transcodedData,
      //               video_base64: videoBase64,
      //               audio_base64: audioBase64,
      //               thumbnail: thumbnail,
      //             },
      //           ]);
      //         }
      //       })
      //       .catch((err) => {
      //         console.log(err);
      //       });
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });
      // if(syncerWorker){
      //   syncerWorker.postMessage({ event: "store_file", data: {
      //     ...transcodedData,
      //     video_base64: videoBase64,
      //     audio_base64: audioBase64,
      //   } })
      // }
    }
  }, [audioBase64]);

  useEffect(() => {
    let intervalId: string | number | NodeJS.Timeout | undefined;
    if (videoURL !== "" && isTranscoding) {
      // setting time from 0 to 1 every 10 milisecond using javascript setInterval method
      intervalId = setInterval(
        () => setTimeElapsed((prevTime) => prevTime + 0.01),
        10
      );
    }
    if (!isTranscoding) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [isTranscoding, videoURL]);

  // console.log(videoBase64);

  useEffect(() => {
    if (typeof videoURL === "string" && waveformRef.current && peaks) {
      // const blob = new Blob([transcodedData.audio_base64], {
      //   type: "audio/mp3",
      // });
      const url = videoURL;
      const wavesurfer = WaveSurfer.create({
        container: "#waveform",
        height: "auto",
        waveColor: "rgb(200, 0, 200)",
        progressColor: "rgb(100, 0, 100)",
        // hideScrollbar: true,
        cursorWidth: 0,

        interact: false,
        fillParent: true,
        peaks: peaks,

        normalize: true,
      });

      if (isTranscoded) {
        wavesurfer.load(url, peaks);

        wavesurfer.on("ready", () => {
          waveformRef.current = wavesurfer;
        });

        wavesurfer.on("redrawcomplete", () => {
          // wavesurfer.zoom(zoomSize + 150);
          setIsWaveformReady(true);
        });

        wavesurfer.on("redraw", () => {
          setIsWaveformReady(false);
        });

        wavesurfer.on("loading", () => {
          // console.log('loading');
          setIsWaveformReady(false);
          // setWaveformProgress(percent);
        });
      }

      return () => wavesurfer.destroy();
    }
  }, [videoURL, isTranscoded, peaks]);

  return (
    <div className="flex items-start gap-4">
      {/* <ScrollArea className="flex flex-col items-start justify-center gap-2 w-72 m-10 ">
        {uploadedVideos.map((video, i: number) => (
          <div key={video.id + "_" + i}>
            <div
              className="text-sm truncate underline cursor-pointer w-[350px]"
              title={video.file_name}
            >
              {video.video_base64 && (
                <video
                  src={video.video_base64.toString()}
                  controls
                  className="w-full"
                />
              )}
              {video.file_name}
            </div>
            <Separator className="my-2" />
          </div>
        ))}
      </ScrollArea> */}
      <div className="flex items-center justify-center w-screen h-[calc(100vh-40vh)] flex-1">
        {loaded ? (
          <div className="flex flex-col items-center justify-center">
            {videoURL !== "" ? (
              <>
                {!isTranscoded && (
                  <video
                    ref={videoRef}
                    controls
                    src={videoURL}
                    height={300}
                    width={450}
                  ></video>
                )}
                <br />
                <span className="mb-2">
                  Time:{" "}
                  {Duration.fromObject({ seconds: timeElapsed }).toFormat(
                    "mm:ss"
                  )}{" "}
                </span>

                {isTranscoded ? (
                  <div className="flex flex-col items-center justify-center gap-2 pt-20">
                    <video
                      ref={videoRef}
                      controls
                      src={URL.createObjectURL(
                        transcodedData.video_base64 as Blob
                      )}
                      height={300}
                      width={450}
                    ></video>

                    <div className=" flex flex-col gap-2">
                      <span>Generated Thumbnail:</span>
                      <img src={thumbnail} height={200} width={300} />
                    </div>

                    <Button
                      variant={"default"}
                      onClick={() => {
                        setFile(undefined);
                        setIsTranscoded(false);
                        setVideoURL("");
                        setProgress(0);
                        setTimeElapsed(0);
                        setAudioBase64(undefined);
                        setVideoBase64(undefined);
                      }}
                      className=" border border-solid border-gray-400 px-2 py-1 rounded-md mb-2"
                    >
                      Upload new file
                    </Button>
                  </div>
                ) : (
                  <>
                    {!isTranscoding && (
                      <Button
                        variant={"default"}
                        onClick={transcode}
                        className=" border border-solid border-gray-400 px-2 py-1 rounded-md"
                      >
                        Transcode video to mp3
                      </Button>
                    )}

                    <div className="flex items-center gap-1 w-full">
                      <Progress value={progress} className="" />
                      <span>{progress}%</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="video">Please select a video</Label>
                <Input
                  id="video"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const blob = new Blob([file], { type: file.type });
                      const url = URL.createObjectURL(blob);
                      setVideoURL(url);
                      setFile(file);
                    }
                  }}
                />
              </div>
            )}
          </div>
        ) : null}

        <Toaster />
      </div>
      <div className="fixed bottom-0">
        {!isWaveformReady && isTranscoded && (
          <span>Generating waveform...</span>
        )}
        <div
          id="waveform"
          ref={waveformRef}
          className="w-[99vw] h-14 overflow-x-auto"
        />
      </div>
    </div>
  );
}

export default App;
