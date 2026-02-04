import { Inter, Lusitana } from "next/font/google";
import localFont from "next/font/local";
export const inter = Inter({ subsets: ["latin"] });
export const lusitana = Lusitana({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const awesomeFont = localFont({
  src: "../../public/fontawesome-webfont.ttf",
  display: "swap",
});
