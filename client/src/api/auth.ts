import api from "./client";

export async function login(username: string, password: string) {
  const res = await api.post<{ token: string; username: string }>(
    "/auth/login",
    { username, password }
  );
  return res.data;
}

export async function register(username: string, password: string) {
  const res = await api.post<{ token: string; username: string }>(
    "/auth/register",
    { username, password }
  );
  return res.data;
}

export async function getMe() {
  const res = await api.get<{ userId: number; username: string }>("/auth/me");
  return res.data;
}
