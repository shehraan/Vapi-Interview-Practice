'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface AgentProps {
  userName?: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  role?: string;
  level?: string;
  techstack?: string;
  amount?: number;
}

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  role,
  level,
  techstack,
  amount,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");

  useEffect(() => {
    const onCallStart = () => {
      setCallStatus(CallStatus.ACTIVE);
    };

    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage = { role: message.role, content: message.transcript };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.log("Error:", error);
      if (error.message.includes("Meeting has ended")) {
        setCallStatus(CallStatus.FINISHED);
      }
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      console.log("handleGenerateFeedback");

      if (!interviewId || !userId) {
        console.error("Missing interviewId or userId for feedback generation.");
        router.push("/");
        return;
      }

      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId,
        userId: userId,
        transcript: messages,
        feedbackId,
      });

      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        console.log("Error saving feedback");
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "interview" && messages.length > 0) {
        handleGenerateFeedback(messages);
      } else if (type === "generate") {
        console.log("Generation process finished or failed.");
      } else {
        router.push("/");
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === "generate") {
      if (!role || !level || !techstack || !amount || !userId) {
        console.error("Missing required data for interview generation. Ensure role, level, techstack, amount, and userId are passed to Agent component.");
        setCallStatus(CallStatus.INACTIVE);
        return;
      }

      try {
        console.log("Attempting to generate interview via API...");
        const response = await fetch('/api/vapi/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: "behavioural",
            role,
            level,
            techstack,
            amount,
            userid: userId,
          }),
        });

        if (!response.ok) {
          let errorBody = "No error details available.";
          try {
            errorBody = await response.text();
          } catch (e) {}
          console.error(`Failed to generate interview. Status: ${response.status} ${response.statusText}. Response: ${errorBody}`);
          setCallStatus(CallStatus.INACTIVE);
          return;
        }

        const result = await response.json();

        if (result.success) {
          console.log("Interview generated successfully via API!");
          alert("Interview generation request sent successfully!");
          setCallStatus(CallStatus.FINISHED);
          router.push('/');
        } else {
          console.error("API indicated failure to generate interview:", result.error || "Unknown API error");
          setCallStatus(CallStatus.INACTIVE);
        }
      } catch (error) {
        console.error("Network or other error calling generation API:", error);
        setCallStatus(CallStatus.INACTIVE);
      }
    } else {
      console.log("Starting interview call with existing questions...");
      let formattedQuestions = "";
      if (questions && questions.length > 0) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join("\n");
        console.log("Formatted questions:", formattedQuestions);
      } else {
        console.warn("No questions provided for interview call.");
      }

      const callVariables: Record<string, any> = {
        questions: formattedQuestions,
      };

      if (userName) {
        callVariables.username = userName;
      }

      try {
        await vapi.start(interviewer, {
          variableValues: callVariables,
        });
      } catch(error) {
        console.error("Error starting Vapi call for interview:", error);
        setCallStatus(CallStatus.INACTIVE);
      }
    }
  };

  const handleDisconnect = () => {
    console.log("Disconnect requested by user.");
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/Interviewer-img-removebg-preview.png"
              alt="profile-image"
              width={130}
              height={90}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/IMG-20250415-WA0005.jpg"
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName || "User"}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && type === "interview" && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center mt-8">
        {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED || callStatus === CallStatus.CONNECTING ? (
          <button
            className={cn(
              "relative btn-call",
              callStatus === CallStatus.CONNECTING && "cursor-not-allowed opacity-70"
            )}
            onClick={handleCall}
            disabled={callStatus === CallStatus.CONNECTING}
          >
            {callStatus === CallStatus.CONNECTING && (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </span>
            )}

            <span className="relative">
              {callStatus === CallStatus.CONNECTING
                ? (type === 'generate' ? 'Generating...' : 'Connecting...')
                : (type === 'generate' ? 'Generate Interview' : 'Start Interview')
              }
            </span>
          </button>
        ) : (
          <button className="btn-disconnect" onClick={handleDisconnect}>
            End Call
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
