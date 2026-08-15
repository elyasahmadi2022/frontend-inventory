import React, { createContext, ReactNode, useContext, useEffect, useState } from "react"


interface SidebarContextType {
    collapsed:  boolean,
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>,
    isMobile: boolean,
    setIsMobile: React.Dispatch<React.SetStateAction<boolean>>,
    mobileMenuOpen: boolean,
    setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>,
    handleSidebarToggle: () => void;
}

interface SidebarProviderProps{
    children: ReactNode
}
const SidebarContext = createContext<SidebarContextType | undefined>(
    undefined
)

export const useSidebar = (): SidebarContextType =>{
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error(
          "useSidebar must be used within a SidebarProvider"
        );
      }
    
      return context;

}

export const LayoutProvider = ({
    children,
  }: SidebarProviderProps) => {
    const [collapsed, setCollapsed] = useState<boolean>(false);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [mobileMenuOpen, setMobileMenuOpen] =
      useState<boolean>(false);
  
    useEffect(() => {
      const handleResize = () => {
        const mobile = window.innerWidth < 768;
  
        setIsMobile(mobile);
  
        if (mobile) {
          setCollapsed(true);
        }
      };
  
      handleResize();
  
      window.addEventListener("resize", handleResize);
  
      return () =>
        window.removeEventListener("resize", handleResize);
    }, []);
  
    const handleSidebarToggle = () => {
      if (isMobile) {
        setMobileMenuOpen((prev) => !prev);
      } else {
        setCollapsed((prev) => !prev);
      }
    };
  
    return (
      <SidebarContext.Provider
        value={{
          collapsed,
          setCollapsed,
          isMobile,
          setIsMobile,
          mobileMenuOpen,
          setMobileMenuOpen,
          handleSidebarToggle,
        }}
      >
        {children}
      </SidebarContext.Provider>
    );
  };