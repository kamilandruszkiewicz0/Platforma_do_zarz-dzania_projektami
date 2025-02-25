import React, { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);

    useEffect(() => {
        if (token) {
            try {
                const decodedPayload = jwtDecode(token);
                if (decodedPayload) {
                    setUser({ username: decodedPayload.unique_name });
                } else {
                    throw new Error("Nie udało się odczytać danych z tokena.");
                }
            } catch (error) {
                console.error("❌ Błąd dekodowania tokena:", error.message);
                updateToken(null);
            }
        }
    }, [token]);

    const updateToken = (newToken) => {
        setToken(newToken);
        if (newToken) {
            localStorage.setItem("token", newToken);
        } else {
            localStorage.removeItem("token");
            setUser(null);
        }
    };

    return (
        <UserContext.Provider value={{ user, token, updateToken }}>
            {children}
        </UserContext.Provider>
    );
};