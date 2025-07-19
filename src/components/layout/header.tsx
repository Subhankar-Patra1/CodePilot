import { Bot } from 'lucide-react';

export function Header() {
  return (
    <header className="py-6 px-4 sm:px-6 lg:px-8 bg-card border-b">
      <div className="max-w-5xl mx-auto flex items-center">
        <Bot className="h-8 w-8 mr-3 text-primary" />
        <h1 className="font-headline text-3xl font-bold text-foreground">
          CodePilot
        </h1>
      </div>
    </header>
  );
}
