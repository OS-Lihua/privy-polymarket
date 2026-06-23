"use client";

import { ReactNode, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { setClientLogAccessTokenGetter } from "@/lib/logger";

export default function ClientLogProvider({
	children,
}: {
	children: ReactNode;
}) {
	const { getAccessToken } = usePrivy();

	useEffect(() => {
		setClientLogAccessTokenGetter(getAccessToken);
		return () => setClientLogAccessTokenGetter(null);
	}, [getAccessToken]);

	return children;
}
