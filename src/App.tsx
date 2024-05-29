/* eslint-disable @typescript-eslint/no-explicit-any */
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { generateVideoThumbnails } from "@rajesh896/video-thumbnails-generator";
import { Duration } from "luxon";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Progress } from "./components/ui/progress";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import { IVideo } from "./stores/videoStore";
import WaveSurfer from "wavesurfer.js";

function App() {
  const { toast } = useToast();
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
  const [audioBase64, setAudioBase64] = useState<string | ArrayBuffer | null>();
  const [videoBase64, setVideoBase64] = useState<string | ArrayBuffer | null>();
  const [thumbnail, setThumbnail] = useState<string>();
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
  });
  const waveformRef = useRef<any>(null);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
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
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
      workerURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.worker.js`,
        "text/javascript"
      ),
    });
    setLoaded(true);
  };

  const transcode = async () => {
    // if (file && file.type === "audio/mp3") return
    setIsTranscoding(true);
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL));
    await ffmpeg.exec(["-i", "input.mp4", "output.mp3"]);
    const fileData = await ffmpeg.readFile("output.mp3");
    const data = new Uint8Array(fileData as ArrayBuffer);
    const audioBlob = new Blob([data], { type: "application/octet-stream" });
    const videoBlob = new Blob([file!], { type: file?.type || "video/mp4" });

    if (videoRef.current) {
      const audioURL = URL.createObjectURL(
        new Blob([data.buffer], { type: "audio/mp3" })
      );
      // videoRef.current.src = audioURL;

      // video file reader instance
      const videoReader = new FileReader();
      videoReader.readAsDataURL(videoBlob);
      videoReader.addEventListener("load", (e: ProgressEvent<FileReader>) => {
        setVideoBase64(e.target?.result);
      });

      //audio file reader instance
      const audioReader = new FileReader();
      audioReader.readAsDataURL(audioBlob);
      audioReader.addEventListener("load", (e: ProgressEvent<FileReader>) => {
        setAudioBase64(e.target?.result);
      });

      if (file) {
        generateVideoThumbnails(file, 3, "file").then((res: string[]) => {
          setThumbnail(res[2]);
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
  }, []);

  useEffect(() => {
    if (audioBase64 && videoBase64 && thumbnail) {
      setTranscodedData((prev) => {
        return {
          ...prev,
          video_base64: videoBase64,
          audio_base64: audioBase64,
          thumbnail: thumbnail,
        };
      });
      setIsTranscoded(true);
      toast({
        variant: "success",
        title: "Success",
        description: "Video transcoded successfully",
      });
      setIsTranscoding(false);
    }
  }, [videoBase64, audioBase64, thumbnail]);
  console.log({ transcodedData });

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

  useEffect(() => {
    if (typeof videoURL === "string" && waveformRef.current) {
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
        media: document.querySelector("video"),

        // normalize: true,
      });

      wavesurfer.load(url);

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

      return () => wavesurfer.destroy();
    }
  }, [videoURL]);

  console.log(isWaveformReady);

  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center w-screen h-screen flex-1">
        {loaded ? (
          <div className="flex flex-col items-center justify-center">
            {videoURL !== "" ? (
              <>
                {!isTranscoded && (
                  <video
                    ref={videoRef}
                    controls
                    src={videoURL}
                    height={400}
                    width={550}
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
                  <>
                    <video
                      ref={videoRef}
                      controls
                      src={transcodedData.video_base64 as string}
                      height={400}
                      width={550}
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
                      }}
                      className=" border border-solid border-gray-400 px-2 py-1 rounded-md mb-2"
                    >
                      Upload new file
                    </Button>
                  </>
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
            <div
              id="waveform"
              ref={waveformRef}
              className="w-[99vw] h-14 overflow-x-auto"
            />
          </div>
        ) : null}

        <Toaster />
      </div>
    </div>
  );
}

export default App;
