"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { User, AuthState } from "@/types";
import { setCookie, getCookie, deleteCookie } from "@/lib/cookies";

interface AuthContextType extends AuthState {
	login: (user: User, token: string, rememberMe?: boolean) => void;
	logout: () => void;
	updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [authState, setAuthState] = useState<AuthState>({
		user: null,
		isAuthenticated: false,
		isLoading: true,
		loginTimestamp: undefined,
	});

	useEffect(() => {
		const loadUser = () => {
			try {
				const cookieUser = getCookie("user");
				const cookieToken = getCookie("token");
				const cookieTimestamp = getCookie("loginTimestamp");

				if (cookieUser && cookieToken) {
					const user = JSON.parse(cookieUser);
					setAuthState({
						user,
						isAuthenticated: true,
						isLoading: false,
						loginTimestamp: cookieTimestamp || undefined,
					});
					return;
				}

				const storedUser = localStorage.getItem("user");
				const storedToken = localStorage.getItem("token");
				const storedTimestamp = localStorage.getItem("loginTimestamp");

				if (storedUser && storedToken) {
					const user = JSON.parse(storedUser);

					const expiryHours = 1 / 24;
					setCookie("user", storedUser, { expires: expiryHours });
					setCookie("token", storedToken, { expires: expiryHours });
					if (storedTimestamp) {
						setCookie("loginTimestamp", storedTimestamp, {
							expires: expiryHours,
						});
					}

					setAuthState({
						user,
						isAuthenticated: true,
						isLoading: false,
						loginTimestamp: storedTimestamp || undefined,
					});
				} else {
					setAuthState({
						user: null,
						isAuthenticated: false,
						isLoading: false,
						loginTimestamp: undefined,
					});
				}
			} catch {
				setAuthState({
					user: null,
					isAuthenticated: false,
					isLoading: false,
					loginTimestamp: undefined,
				});
			}
		};

		loadUser();
	}, []);

	const login = (user: User, token: string, rememberMe?: boolean) => {
		const loginTimestamp = new Date().toISOString();
		const expiryHours = rememberMe ? 24 * 7 : 1 / 24; // 7 days if remember me, else 1 hour

		setCookie("user", JSON.stringify(user), { expires: expiryHours });
		setCookie("token", token, { expires: expiryHours });
		setCookie("loginTimestamp", loginTimestamp, { expires: expiryHours });

		localStorage.setItem("user", JSON.stringify(user));
		localStorage.setItem("token", token);
		localStorage.setItem("loginTimestamp", loginTimestamp);

		setAuthState({
			user,
			isAuthenticated: true,
			isLoading: false,
			loginTimestamp,
		});
	};

	const logout = () => {
		deleteCookie("user");
		deleteCookie("token");
		deleteCookie("loginTimestamp");

		localStorage.removeItem("user");
		localStorage.removeItem("token");
		localStorage.removeItem("loginTimestamp");

		setAuthState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
			loginTimestamp: undefined,
		});
	};

	const updateUser = (user: User) => {
		const userJson = JSON.stringify(user);
		const expiryHours = 1 / 24;

		setCookie("user", userJson, { expires: expiryHours });
		localStorage.setItem("user", userJson);

		setAuthState((prev) => ({
			...prev,
			user,
		}));
	};

	const value: AuthContextType = {
		...authState,
		login,
		logout,
		updateUser,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
