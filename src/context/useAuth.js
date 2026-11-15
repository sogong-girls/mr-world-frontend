import { createContext, useContext } from "react";

// 컴포넌트 파일(AuthContext.jsx)과 나눠 둬야 Vite fast refresh가 동작한다
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);
