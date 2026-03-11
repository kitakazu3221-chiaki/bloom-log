export type SignalingMessage =
  | { type: "create-session" }
  | { type: "session-created"; sessionId: string }
  | { type: "join-session"; sessionId: string }
  | { type: "peer-joined"; sessionId: string }
  | { type: "peer-left" }
  | { type: "error"; message: string }
  | {
      type: "signal";
      sdp?: RTCSessionDescriptionInit;
      candidate?: RTCIceCandidateInit;
    };

export type ScalpArea = "top" | "front" | "side";

export const SCALP_AREA_LABELS: Record<ScalpArea, string> = {
  top: "頭頂部",
  front: "前頭部",
  side: "側頭部",
};

export type WSConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export type RTCConnectionState =
  | "new"
  | "connecting"
  | "connected"
  | "disconnected"
  | "failed";

export interface CapturedPhoto {
  dataUrl: string;
  area: ScalpArea;
  timestamp: Date;
}

export interface NoteData {
  shampoo?: string;
  treatment?: string;
  sleep?: number;
  stress?: number;
  exercise?: boolean;
  exerciseType?: string;
  diet?: number;
  alcohol?: boolean;
  supplements?: string;
  scalpMassage?: boolean;
}

export interface PhotoRecord {
  id: string;
  date: string;
  area: ScalpArea;
  filename: string;
  notes: NoteData;
}
