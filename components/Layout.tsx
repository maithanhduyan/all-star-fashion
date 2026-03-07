import Navbar from "./Navbar.tsx";
import Footer from "./Footer.tsx";
import ScrollToTop from "../islands/ScrollToTop.tsx";
import ChatWidget from "../islands/ChatWidget.tsx";
import PageTransition from "../islands/PageTransition.tsx";
import { ComponentChildren } from "preact";

interface LayoutProps {
  children: ComponentChildren;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div class="min-h-screen flex flex-col">
      <Navbar />
      <main class="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
      <ChatWidget />
      <PageTransition />
    </div>
  );
}
