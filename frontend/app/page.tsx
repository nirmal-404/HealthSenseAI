import Navbar from '@/components/common/navbar';

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            Welcome to Your App
          </h1>
          
          <p className="text-lg md:text-xl text-foreground/70 leading-relaxed">
            Get started by clicking the Login or Sign up buttons in the navigation bar above. Try resizing your browser to see the responsive design in action.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {['Feature One', 'Feature Two', 'Feature Three'].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-lg border border-border bg-card hover:bg-card/50 transition-colors"
              >
                <div className="h-10 w-10 rounded bg-primary/20 mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{feature}</h3>
                <p className="text-sm text-foreground/60">
                  Describe the benefits and features of your application here.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
