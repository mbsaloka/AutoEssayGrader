import React from "react";
import {
	FacebookLogo,
	InstagramLogo,
	TwitterLogo,
	LinkedinLogo,
} from "phosphor-react";

export default function Footer() {
	return (
		<footer className="bg-[#1e1f22] border-t border-gray-700 text-gray-300">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				

				{/* Bottom Section */}
				<div className="border-gray-700">
					<div className="flex flex-col md:flex-row justify-center items-center gap-4">
						{/* Links */}
						{/* <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs md:text-sm">
							<a
								href="#"
								className="hover:text-yellow-400 transition-colors"
							>
								Legal
							</a>
							<a
								href="#"
								className="hover:text-yellow-400 transition-colors"
							>
								Privacy Policy
							</a>
							<a
								href="#"
								className="hover:text-yellow-400 transition-colors"
							>
								Cookies
							</a>
							<a
								href="#"
								className="hover:text-yellow-400 transition-colors"
							>
								About Ads
							</a>
							<a
								href="#"
								className="hover:text-yellow-400 transition-colors"
							>
								Accessibility
							</a>
						</div> */}

						{/* Copyright */}
						<p className="text-xs md:text-sm text-gray-400">
							© 2025 Grade Mind. All rights reserved.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
