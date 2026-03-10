import { useI18n } from "../hooks/useI18n";
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
  const { t } = useI18n();
  let color: string;
  let label: string;

  if (wsState !== "connected") {
    color = "bg-red-400";
    label = t["connection.serverDisconnected"];
  } else if (!peerJoined) {
    color = "bg-amber-500";
    label = t["connection.waitingPhone"];
  } else if (rtcState === "connected") {
    color = "bg-emerald-500";
    label = t["connection.connected"];
  } else if (rtcState === "connecting") {
    color = "bg-amber-500";
    label = t["connection.videoConnecting"];
  } else if (rtcState === "failed") {
    color = "bg-red-400";
    label = t["connection.failed"];
  } else {
    color = "bg-amber-500";
    label = t["connection.preparing"];
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-base text-gray-500">{label}</span>
    </div>
  );
}
