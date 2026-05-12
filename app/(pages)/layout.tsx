import { NavBar } from "@/components/common/NavBar/NavBar";
import { MobileTopBar } from "@/components/common/NavBar/MobileTopBar";

export default function WithNavLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MobileTopBar />
      <NavBar />
      {children}
    </>
  );
}