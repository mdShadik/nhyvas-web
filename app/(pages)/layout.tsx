"use client";

import { usePathname } from "next/navigation";
import { NavBar } from "@/components/common/NavBar/NavBar";
import { MobileTopBar } from "@/components/common/NavBar/MobileTopBar";

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");
  const isAddProperty = pathname.startsWith("/add-property");
  const isProperty = pathname.startsWith("/property");

  return (
    <>
      {!isChat && <MobileTopBar />}
      <NavBar hideMobile={isAddProperty || isProperty || isChat} />
      {children}
    </>
  );
}