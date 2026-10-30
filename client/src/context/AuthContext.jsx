import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/authApi";

const AuthContext = createContext(null);

const TOKEN_KEY = "eventpulse_token";
const USER_KEY = "eventpulse_user";

// Load existing login information
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (!token || !savedUser) {
      return { token: null, user: null };
    }

    const user = JSON.parse(savedUser);

    if (!user || typeof user !== "object" || !user.id) {
      throw new Error("Invalid stored user");
    }

    return { token, user };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getStoredAuth);

  // Register user
  const register = async (userData) => {
    return await registerUser(userData);
  };

  // Login user
  const login = async (credentials) => {
    const data = await loginUser(credentials);

    if (!data.token || !data.user?.id) {
      throw new Error("Invalid login response from server");
    }

    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    setAuth({
      token: data.token,
      user: data.user,
    });

    return data;
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setAuth({
      token: null,
      user: null,
    });
  };

  const isAuthenticated = Boolean(auth.token && auth.user);

  const isAdmin = isAuthenticated && auth.user.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user: auth.user,
        token: auth.token,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access authentication
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};