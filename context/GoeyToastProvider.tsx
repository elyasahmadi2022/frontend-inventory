"use client";
import { GooeyToaster } from "@/components/ui/goey-toaster";
export const GoeyToastProvider = ({children}: {children: React.ReactNode}) => {
    return (
        <>
        <GooeyToaster   position="bottom-right"  bounce={0.4} spring={true} preset="bouncy" queueOverflow={"drop-oldest"} theme="light" />
        {children}
        </>
    )
}