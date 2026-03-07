import type { WSConnectionState, RTCConnectionState } from "../types";

interface ConnectionStatusProps {
  wsState: WSConnectionState;
  rtcState: RTCConnectionState;
  peerJoined: boolean;
}

export function ConnectionStatus({
  wsState,
  rtcState,
  peerJoined,
}: ConnectionStatusProps) {
  let color: string;
  let label: string;

  if (wsState !== "connected") {
    color = "bg-red-500";
    label = "サーバー未接続";
  } else if (!peerJoined) {
    color = "bg-yellow-500";
    label = "スマホ待ち";
  } else if (rtcState === "connected") {
    color = "bg-green-500";
    label = "接続中";
  } else if (rtcState === "connecting") {
    color = "bg-yellow-500";
    label = "映像接続中...";
  } else if (rtcState === "failed") {
    color = "bg-red-500";
    label = "接続失敗";
  } else {
    color = "bg-yellow-500";
    label = "準備中";
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
