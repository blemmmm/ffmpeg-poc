import { useState, useRef, useEffect } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL, fetchFile } from "@ffmpeg/util";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { IVideo, useVideoStore } from "./stores/videoStore";
import { v4 as uuidv4 } from "uuid";
import { Toaster } from "./components/ui/toaster";
import { useToast } from "./components/ui/use-toast";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Separator } from "./components/ui/separator";

function App() {
  const { toast } = useToast();
  const { uploadedVideos, setUploadedVideos } = useVideoStore();
  const [loaded, setLoaded] = useState(false);
  const ffmpegRef = useRef(new FFmpeg());
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const messageRef = useRef<HTMLParagraphElement | null>(null);
  const [videoURL, setVideoURL] = useState("");
  const [file, setFile] = useState<File>();
  const [isTranscoded, setIsTranscoded] = useState(false);

  const load = async () => {
    const baseURL = "https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm";
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) messageRef.current.innerHTML = message;
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
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoURL));
    await ffmpeg.exec(["-i", "input.mp4", "output.mp3"]);
    const fileData = await ffmpeg.readFile("output.mp3");
    const data = new Uint8Array(fileData as ArrayBuffer);
    if (videoRef.current) {
      const audioURL = URL.createObjectURL(
        new Blob([data.buffer], { type: "audio/mp3" })
      );
      videoRef.current.src = audioURL;

      const transcodedData: IVideo = {
        id: uuidv4(),
        video_url: videoURL,
        audio_url: audioURL,
        file_name: file?.name || "input.mp3",
        source_file_type: file?.type || "video/mp4",
        created_at: new Date().toISOString(),
      };

      setUploadedVideos([...uploadedVideos, transcodedData]);
      setIsTranscoded(true);
      toast({
        title: "Success",
        description: "Video transcoded successfully",
        color: "green",
      });
    }
  };

  useEffect(() => {
    if (!loaded) {
      load(); //load ffmpeg
    }
  }, []);

  return (
    <>
      <ScrollArea className="flex flex-col items-start justify-center gap-2 w-72 m-10">
        {uploadedVideos.map((video) => (
          <>
            <div
              key={video.id}
              className="text-sm truncate w-full underline cursor-pointer"
              title={video.file_name}
            >
              {video.file_name}
            </div>
            <Separator className="my-2" />
          </>
        ))}
      </ScrollArea>
      <div className="flex items-center justify-center w-screen h-[calc(100vh-40vh)]">
        {loaded ? (
          <div className="flex flex-col items-center justify-center">
            {videoURL !== "" ? (
              <>
                <video ref={videoRef} controls src={videoURL}></video>
                <br />

                {isTranscoded ? (
                  <Button
                    variant={"default"}
                    onClick={() => {
                      setFile(undefined);
                      setIsTranscoded(false);
                      setVideoURL("");
                    }}
                    className=" border border-solid border-gray-400 px-2 py-1 rounded-md"
                  >
                    Upload new file
                  </Button>
                ) : (
                  <>
                    <Button
                      variant={"default"}
                      onClick={transcode}
                      className=" border border-solid border-gray-400 px-2 py-1 rounded-md"
                    >
                      Transcode mp4 to mp3
                    </Button>
                    <p ref={messageRef}></p>
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
    </>
  );
}

export default App;
