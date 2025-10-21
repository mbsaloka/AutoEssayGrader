"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import {
	Moon,
	Sun,
	SignOut,
	UserCircle,
	List,
	X,
	PencilSimple,
} from "phosphor-react";

const ThemeToggle: React.FC<{ isDark: boolean; toggle: () => void }> = ({
	isDark,
	toggle,
}) => (
	<button
		onClick={toggle}
		className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border bg-gray-700 border-gray-600 hover:bg-gray-600"
		aria-label="Toggle theme"
	>
		{isDark ? (
			<Sun className="w-5 h-5 text-yellow-400" weight="bold" />
		) : (
			<Moon className="w-5 h-5 text-yellow-400" weight="bold" />
		)}
	</button>
);

const NavLink: React.FC<{
	href: string;
	isActive: boolean;
	onClick?: () => void;
	children: React.ReactNode;
}> = ({ href, isActive, onClick, children }) => (
	<Link
		href={href}
		className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
			isActive ? "text-yellow-400" : "text-gray-300 hover:text-white"
		}`}
		onClick={onClick}
	>
		{children}
	</Link>
);

const Navbar: React.FC = () => {
	const pathname = usePathname();
	const { isAuthenticated, logout, user } = useAuth();
	const { isDarkMode, toggleTheme } = useTheme();

	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [showMobileMenu, setShowMobileMenu] = useState(false);

	const profileMenuRef = useRef<HTMLDivElement>(null);
	const mobileMenuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				profileMenuRef.current &&
				!profileMenuRef.current.contains(event.target as Node)
			) {
				setShowProfileMenu(false);
			}
			if (
				mobileMenuRef.current &&
				!mobileMenuRef.current.contains(event.target as Node)
			) {
				setShowMobileMenu(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleLogout = () => {
		logout();
		window.location.href = "/";
	};

	const isActive = (path: string) => pathname === path;
	const homeUrl = isAuthenticated ? "/dashboard" : "/";

	return (
		<nav className="bg-[#2b2d31] border-b border-gray-700 sticky top-0 z-50 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					<Link href="/" className="flex items-center space-x-2">
						<div className="text-xl sm:text-2xl font-bold">
							<span className="text-yellow-400">GRADE</span>
							<span className="text-white"> MIND</span>
						</div>
					</Link>
					<div className="hidden md:flex items-center space-x-4">
						<NavLink href={homeUrl} isActive={isActive(homeUrl)}>
							Beranda
						</NavLink>
						<NavLink href="/tentang" isActive={isActive("/tentang")}>
							Tentang
						</NavLink>
						{/* <ThemeToggle isDark={isDarkMode} toggle={toggleTheme} /> */}
						<div className="relative" ref={profileMenuRef}>
							<button
								onClick={() =>
									setShowProfileMenu(!showProfileMenu)
								}
								className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border border-gray-600 hover:border-yellow-400 overflow-hidden bg-gray-400"
								aria-label="Profile"
							>
								{isAuthenticated && user?.profile_picture ? (
									<Image
										src={user.profile_picture}
										alt="profil default icon"
										width={40}
										height={40}
										className="w-full h-full object-cover"
										unoptimized
										onError={(e) => {
											const target =
												e.target as HTMLImageElement;
											target.style.display = "none";
											const parent = target.parentElement;
											if (parent) {
												const icon =
													document.createElement(
														"div"
													);
												icon.innerHTML =
													'<svg class="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>';
												parent.appendChild(
													icon.firstChild as Node
												);
											}
										}}
									/>
								) : (
									<UserCircle
										className="w-6 h-6 text-gray-300"
										weight="bold"
									/>
								)}
							</button>
							{showProfileMenu && (
								<div className="absolute right-0 mt-2 w-72 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2 z-50">
									{isAuthenticated ? (
										<>
											<div className="px-4 py-3 border-b border-gray-700">
												<div className="flex items-center space-x-3">
													<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 shadow-lg flex-shrink-0 bg-gradient-to-br from-yellow-400 to-yellow-600">
														{user?.profile_picture ? (
															<Image
																src={
																	user.profile_picture
																}
																alt="profil default icon"
																width={48}
																height={48}
																className="w-full h-full object-cover"
																unoptimized
																onError={(
																	e
																) => {
																	const target =
																		e.target as HTMLImageElement;
																	target.style.display =
																		"none";
																}}
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center">
																<UserCircle
																	className="w-8 h-8 text-white"
																	weight="bold"
																/>
															</div>
														)}
													</div>
													<div className="flex-1 min-w-0">
														<p className="text-sm font-semibold text-white truncate">
															{user?.fullname ||
																user?.username ||
																"Username"}
														</p>
														<p className="text-xs text-gray-400 truncate">
															{user?.email ||
																"user@example.com"}
														</p>
													</div>
												</div>
											</div>
											<div className="px-2 py-2">
												<Link
													href="/profil"
													className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700 rounded-md transition-colors"
													onClick={() =>
														setShowProfileMenu(
															false
														)
													}
												>
													<div className="flex items-center gap-2">
														<PencilSimple
															className="w-4 h-4"
															weight="bold"
														/>
														Edit Profil
													</div>
												</Link>
												<button
													onClick={() => {
														handleLogout();
														setShowProfileMenu(
															false
														);
													}}
													className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-md transition-colors"
												>
													<div className="flex items-center gap-2">
														<SignOut
															className="w-4 h-4"
															weight="bold"
														/>
														Keluar
													</div>
												</button>
											</div>
										</>
									) : (
										<>
											<div className="px-4 py-3 border-b border-gray-700">
												<p className="text-sm text-gray-400 text-left">
													Belum masuk
												</p>
												<p className="text-xs text-gray-500 text-left mt-1">
													Silakan masuk untuk
													mengakses fitur lengkap
												</p>
											</div>
											<div className="px-4 py-2">
												<Link
													href="/masuk"
													className="block w-full text-center px-4 py-2 text-sm text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-md transition-colors font-medium"
													onClick={() =>
														setShowProfileMenu(
															false
														)
													}
												>
													Masuk
												</Link>
											</div>
										</>
									)}
								</div>
							)}
						</div>
					</div>
					<div className="md:hidden flex items-center space-x-2">
						<ThemeToggle isDark={isDarkMode} toggle={toggleTheme} />
						<button
							onClick={() => setShowMobileMenu(!showMobileMenu)}
							className="w-10 h-10 rounded-full flex items-center justify-center transition-colors border bg-gray-700 border-gray-600 hover:bg-gray-600"
							aria-label="Toggle menu"
						>
							{showMobileMenu ? (
								<X
									className="w-6 h-6 text-white"
									weight="bold"
								/>
							) : (
								<List
									className="w-6 h-6 text-white"
									weight="bold"
								/>
							)}
						</button>
					</div>
				</div>
				{showMobileMenu && (
					<div
						ref={mobileMenuRef}
						className="md:hidden absolute top-16 left-0 right-0 bg-[#2b2d31] border-b border-gray-700 shadow-xl z-40 animate-slideDown"
					>
						<div className="px-4 py-4 space-y-1">
							<Link
								href={homeUrl}
								className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all ${
									isActive(homeUrl)
										? "text-yellow-400 bg-gray-800/80"
										: "text-gray-300 hover:text-white hover:bg-gray-800/50"
								}`}
								onClick={() => setShowMobileMenu(false)}
							>
								<span className="ml-3">Beranda</span>
							</Link>
							<Link
								href="/tentang"
								className={`flex items-center px-4 py-3 rounded-lg text-base font-medium transition-all ${
									isActive("/tentang")
										? "text-yellow-400 bg-gray-800/80"
										: "text-gray-300 hover:text-white hover:bg-gray-800/50"
								}`}
								onClick={() => setShowMobileMenu(false)}
							>
								<span className="ml-3">Tentang</span>
							</Link>

							{isAuthenticated ? (
								<div className="pt-3 mt-3 border-t border-gray-700">
									<div className="px-4 py-3  rounded-lg mb-2">
										<div className="flex items-center space-x-3">
											<div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 shadow-lg flex-shrink-0 bg-gradient-to-br from-yellow-400 to-yellow-600">
												{user?.profile_picture ? (
													<Image
														src={
															user.profile_picture
														}
														alt="profil default icon"
														width={48}
														height={48}
														className="w-full h-full object-cover"
														unoptimized
														onError={(e) => {
															const target =
																e.target as HTMLImageElement;
															target.style.display =
																"none";
														}}
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-white text-lg font-bold">
														{user?.fullname
															?.charAt(0)
															.toUpperCase() ||
															user?.username
																?.charAt(0)
																.toUpperCase() ||
															"U"}
													</div>
												)}
											</div>
											<div className="flex-1 min-w-0">
												<p className="text-sm font-semibold text-white truncate">
													{user?.fullname ||
														user?.username ||
														"Username"}
												</p>
												<p className="text-xs text-gray-400 truncate">
													{user?.email ||
														"user@gmail.com"}
												</p>
											</div>
										</div>
									</div>
									<Link
										href="/profil"
										className="flex items-center px-4 py-3 text-base text-white hover:bg-gray-800/50 rounded-lg transition-all"
										onClick={() => setShowMobileMenu(false)}
									>
										<PencilSimple
											className="w-5 h-5 text-blue-400"
											weight="bold"
										/>
										<span className="ml-3">
											Edit Profil
										</span>
									</Link>
									<button
										onClick={() => {
											handleLogout();
											setShowMobileMenu(false);
										}}
										className="flex items-center w-full px-4 py-3 text-base text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
									>
										<SignOut
											className="w-5 h-5"
											weight="bold"
										/>
										<span className="ml-3">Keluar</span>
									</button>
								</div>
							) : (
								<div className="pt-2">
									<Link
										href="/masuk"
										className="flex items-center justify-center px-4 py-3 text-base font-semibold text-gray-900 bg-yellow-400 hover:bg-yellow-500 rounded-lg transition-all shadow-md"
										onClick={() => setShowMobileMenu(false)}
									>
										<span className="ml-2">
											Masuk Sekarang
										</span>
									</Link>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</nav>
	);
};

export default Navbar;
