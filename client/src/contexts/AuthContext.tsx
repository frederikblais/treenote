import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth";

interface AuthState {
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      authApi
        .getMe()
        .then((data) => setUsername(data.username))
        .catch(() => {
          localStorage.removeItem("token");
          localStorage.removeItem("username");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (user: string, pass: string) => {
    const data = await authApi.login(user, pass);
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    setUsername(data.username);
  };

  const register = async (user: string, pass: string) => {
    const data = await authApi.register(user, pass);
    localStorage.setItem("token", data.token);
    localStorage.setItem("username", data.username);
    setUsername(data.username);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
