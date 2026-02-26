import { createContext, useContext, useState, ReactNode } from "react";

interface UserInfo {
  _id: string;
  name: string;
  age: number;
  gender: string;
  bio?: string;
  avatar?: string;
  email: string;
}

interface UserContextType {
  currentUserId: string | null;
  accessToken: string | null;
  user: UserInfo | null;
  setAuth: (userId: string, token: string, userInfo: UserInfo) => void;
  clearAuth: () => void;
}

const UserContext = createContext<UserContextType>({
  currentUserId: null,
  accessToken: null,
  user: null,
  setAuth: () => {},
  clearAuth: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    localStorage.getItem("currentUserId")
  );
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken")
  );
  const [user, setUser] = useState<UserInfo | null>(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const setAuth = (userId: string, token: string, userInfo: UserInfo) => {
    setCurrentUserId(userId);
    setAccessToken(token);
    setUser(userInfo);
    localStorage.setItem("currentUserId", userId);
    localStorage.setItem("accessToken", token);
    localStorage.setItem("user", JSON.stringify(userInfo));
  };

  const clearAuth = () => {
    setCurrentUserId(null);
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider
      value={{ currentUserId, accessToken, user, setAuth, clearAuth }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
