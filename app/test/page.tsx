import ChatBox from "./ChatBox";

export default function TestPage() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 flex items-center justify-center transition-colors duration-300">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">
            AI Assistant
          </h1>
          <p className="text-muted-foreground font-medium">
            Next-generation multimodal intelligence
          </p>
        </div>

        <ChatBox />

        <div className="flex flex-wrap justify-center gap-6 text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            Secure
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            Multimodal
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full" />
            Real-time
          </div>
        </div>
      </div>
    </main>
  );
}
