import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex flex-col items-center justify-center w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
          Nhyvas
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          A simple and easy-to-use web app for managing your notes.
        </p>
      </div>
    </div>
  );
}
