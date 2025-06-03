import Header from '../navigation/Header';
import BottomNav from '../navigation/BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-base-100">
      <Header title={title} />
      
      <main className="container mx-auto px-4 pb-20 pt-4">
        {children}
      </main>
      
      <BottomNav />
    </div>
  );
} 