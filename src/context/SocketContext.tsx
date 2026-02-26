import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSelector } from "react-redux";
import { useToast } from "@/hooks/use-toast";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { toast } = useToast();

  // Lấy currentUser từ Redux
  const currentUser = useSelector(
    (state: any) => state.auth?.login?.currentUser,
  );
  const userId = currentUser?._id;

  useEffect(() => {
    // Chỉ connect khi đã có userId (tức là đã đăng nhập)
    if (!userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Kết nối tới Server Socket
    // Chú ý URL phải khớp với BE (Vd: http://localhost:4000)
    const newSocket = io(
      "http://deploydemocliquebe-production.up.railway.app:4000",
      {
        transports: ["websocket", "polling"],
        autoConnect: true,
      },
    );

    newSocket.on("connect", () => {
      console.log("🟢 Đã kết nối Socket Server", newSocket.id);

      // Báo danh user_id cho server biết để lưu vào Map
      newSocket.emit("register_user", userId);
    });

    // Lắng nghe sự kiện "receive_notification" từ server đẩy về
    newSocket.on("receive_notification", (notificationData: any) => {
      console.log("💌 Notification Realtime:", notificationData);

      const { type, sender } = notificationData;
      const senderName = sender?.name || "Một người dùng";

      if (type === "match") {
        toast({
          title: "💖 It's a Match!",
          description: `Bạn có một tương hợp mới với ${senderName}.`,
        });
      } else if (type === "like") {
        toast({
          title: "❤️ Ai đó vừa thích bạn",
          description: `${senderName} vừa tym bạn!`,
        });
      } else {
        toast({
          title: "🔔 Thông báo mới",
          description: "Bạn có thông báo mới.",
        });
      }
    });

    setSocket(newSocket);

    // Cleanup khi unmount hoặc userId đổi
    return () => {
      newSocket.off("connect");
      newSocket.off("receive_notification");
      newSocket.disconnect();
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
