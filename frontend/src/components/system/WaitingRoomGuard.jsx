import React from "react";
import WaitingRoomPage from "./WaitingRoomPage";

export default function WaitingRoomGuard({
  queueState,
  leaveQueue,
  isAuthorizedAdmin,
  children,
}) {
  // If user is currently placed in waiting room and not an exempted admin
  if (queueState?.inQueue && !isAuthorizedAdmin && !queueState?.isAdmitted) {
    return (
      <WaitingRoomPage
        position={queueState.position}
        totalInQueue={queueState.totalInQueue}
        estimatedWaitSecs={queueState.estimatedWaitSecs}
        message={queueState.message}
        onLeaveQueue={leaveQueue}
      />
    );
  }

  return <>{children}</>;
}
