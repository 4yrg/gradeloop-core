"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";
import { IVASWebSocketClient } from "../services/websocket";

type SessionStatus = "idle" | "connecting" | "ready" | "listening" | "thinking" | "speaking";

interface ConversationMessage {
  speaker: "student" | "ai";
  text: string;
  timestamp: Date;
}

export default function VivaSession() {
  // Form state
  const [studentId, setStudentId] = useState("CS2021001");
  const [studentName, setStudentName] = useState("John Doe");
  const [labAssignment, setLabAssignment] = useState(
    "Write a Python function to reverse a string without using built-in reverse methods."
  );
  const [studentCode, setStudentCode] = useState(
    "def reverse_string(s):\n    return s[::-1]"
  );

  // Session state
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // WebSocket and audio refs
  const wsClient = useRef<IVASWebSocketClient | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioContext = useRef<AudioContext | null>(null);
  const audioQueue = useRef<string[]>([]);
  const isPlayingAudio = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsClient.current) {
        wsClient.current.close();
      }
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop();
      }
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, []);

  /**
   * Request microphone permission and setup MediaRecorder
   */
  const setupMicrophone = async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      mediaRecorder.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        if (audioChunks.current.length > 0 && wsClient.current) {
          // Combine all chunks and send
          const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
          wsClient.current.sendAudioChunk(audioBlob, true);
          audioChunks.current = [];
        }
      };

      console.log("🎤 Microphone ready");
    } catch (error) {
      console.error("Failed to access microphone:", error);
      setErrorMessage("Failed to access microphone. Please grant permission.");
      throw error;
    }
  };

  /**
   * Setup Audio Context for playback
   */
  const setupAudioContext = (): void => {
    if (!audioContext.current) {
      audioContext.current = new AudioContext();
    }
  };

  /**
   * Play audio from base64 string
   */
  const playAudio = async (base64Audio: string): Promise<void> => {
    try {
      setupAudioContext();

      // Decode base64 to array buffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Decode audio data
      const audioBuffer = await audioContext.current!.decodeAudioData(bytes.buffer);

      // Create and play source
      const source = audioContext.current!.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current!.destination);

      source.onended = () => {
        isPlayingAudio.current = false;
        setSessionStatus("ready");
        // Play next in queue if any
        if (audioQueue.current.length > 0) {
          const nextAudio = audioQueue.current.shift()!;
          playAudio(nextAudio);
        }
      };

      source.start(0);
      isPlayingAudio.current = true;
      setSessionStatus("speaking");
    } catch (error) {
      console.error("Failed to play audio:", error);
      isPlayingAudio.current = false;
      setSessionStatus("ready");
    }
  };

  /**
   * Queue audio for playback
   */
  const queueAudio = (base64Audio: string): void => {
    if (isPlayingAudio.current) {
      audioQueue.current.push(base64Audio);
    } else {
      playAudio(base64Audio);
    }
  };

  /**
   * Start viva session
   */
  const startSession = async (): Promise<void> => {
    try {
      setSessionStatus("connecting");
      setErrorMessage(null);

      // Setup microphone
      await setupMicrophone();

      // Generate session ID
      const sessionId = `session-${Date.now()}`;

      // Create WebSocket client
      wsClient.current = new IVASWebSocketClient(sessionId);

      // Setup message handlers
      wsClient.current.on("connection", (data) => {
        console.log("Connected:", data);
      });

      wsClient.current.on("session_started", (data) => {
        console.log("Session started:", data);
        setSessionStatus("ready");
      });

      wsClient.current.on("transcript", (data) => {
        console.log("Transcript:", data.text);
        setConversation((prev) => [
          ...prev,
          {
            speaker: "student",
            text: data.text,
            timestamp: new Date(),
          },
        ]);
        setSessionStatus("thinking");
      });

      wsClient.current.on("ai_response", (data) => {
        console.log("AI Response:", data.text);
        setConversation((prev) => [
          ...prev,
          {
            speaker: "ai",
            text: data.text,
            timestamp: new Date(),
          },
        ]);
      });

      wsClient.current.on("ai_audio", (data) => {
        console.log("AI Audio received");
        queueAudio(data.audio);
      });

      wsClient.current.on("error", (data) => {
        console.error("Server error:", data.message);
        setErrorMessage(data.message);
        setSessionStatus("ready");
      });

      wsClient.current.on("session_end", (data) => {
        console.log("Session ended:", data);
        setSessionStatus("idle");
        setIsRecording(false);
      });

      // Connect to WebSocket
      await wsClient.current.connect();

      // Start session
      wsClient.current.startSession({
        student_id: studentId,
        student_name: studentName,
        lab_assignment: labAssignment,
        student_code: studentCode,
      });
    } catch (error) {
      console.error("Failed to start session:", error);
      setErrorMessage("Failed to start session. Please try again.");
      setSessionStatus("idle");
    }
  };

  /**
   * Start recording audio
   */
  const startRecording = (): void => {
    if (!mediaRecorder.current || sessionStatus !== "ready") {
      return;
    }

    try {
      audioChunks.current = [];
      mediaRecorder.current.start(250); // Collect data every 250ms
      setIsRecording(true);
      setSessionStatus("listening");
      console.log("🎤 Recording started");
    } catch (error) {
      console.error("Failed to start recording:", error);
      setErrorMessage("Failed to start recording");
    }
  };

  /**
   * Stop recording audio
   */
  const stopRecording = (): void => {
    if (!mediaRecorder.current || !isRecording) {
      return;
    }

    try {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setSessionStatus("thinking");
      console.log("🎤 Recording stopped");
    } catch (error) {
      console.error("Failed to stop recording:", error);
    }
  };

  /**
   * End session
   */
  const endSession = (): void => {
    if (wsClient.current) {
      wsClient.current.endSession();
      wsClient.current.close();
      wsClient.current = null;
    }

    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }

    setSessionStatus("idle");
    setIsRecording(false);
    setConversation([]);
  };

  /**
   * Get status indicator
   */
  const getStatusChip = () => {
    const statusConfig = {
      idle: { color: "default" as const, text: "Not Started" },
      connecting: { color: "warning" as const, text: "Connecting..." },
      ready: { color: "success" as const, text: "Ready" },
      listening: { color: "primary" as const, text: "🎤 Listening..." },
      thinking: { color: "secondary" as const, text: "🤔 Thinking..." },
      speaking: { color: "secondary" as const, text: "🔊 Speaking..." },
    };

    const config = statusConfig[sessionStatus];
    return <Chip color={config.color}>{config.text}</Chip>;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Status Bar */}
      <Card>
        <CardBody className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-default-600">Status:</span>
            {getStatusChip()}
          </div>
          {sessionStatus !== "idle" && (
            <Button color="danger" size="sm" onClick={endSession}>
              End Session
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <Card className="border-danger">
          <CardBody>
            <p className="text-danger">{errorMessage}</p>
          </CardBody>
        </Card>
      )}

      {/* Session Setup Form */}
      {sessionStatus === "idle" && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Start Viva Session</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="CS2021001"
              />
              <Input
                label="Student Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <Textarea
              label="Lab Assignment"
              value={labAssignment}
              onChange={(e) => setLabAssignment(e.target.value)}
              placeholder="Describe the lab assignment..."
              minRows={2}
            />
            <Textarea
              label="Student Code"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value)}
              placeholder="Paste your code here..."
              minRows={6}
              classNames={{
                input: "font-mono",
              }}
            />
            <Button color="primary" size="lg" fullWidth onClick={startSession}>
              Start Viva Session
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Recording Controls */}
      {sessionStatus !== "idle" && (
        <Card>
          <CardBody className="flex flex-col items-center gap-4">
            <p className="text-sm text-default-600">
              {isRecording
                ? "Press button to stop speaking"
                : sessionStatus === "ready"
                  ? "Press button to start speaking"
                  : "Please wait..."}
            </p>
            <Button
              color={isRecording ? "danger" : "primary"}
              size="lg"
              isDisabled={sessionStatus !== "ready" && !isRecording}
              onPress={isRecording ? stopRecording : startRecording}
              className="w-32 h-32 rounded-full"
            >
              {isRecording ? "🛑 Stop" : "🎤 Talk"}
            </Button>
            {sessionStatus === "listening" && (
              <Progress
                size="sm"
                isIndeterminate
                aria-label="Recording..."
                className="max-w-md"
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Conversation Display */}
      {conversation.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Conversation</h3>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-4 max-h-[500px] overflow-y-auto">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.speaker === "student" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.speaker === "student"
                      ? "bg-primary text-primary-foreground"
                      : "bg-default-100"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {message.speaker === "student" ? "You" : "AI Examiner"}
                    </span>
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
