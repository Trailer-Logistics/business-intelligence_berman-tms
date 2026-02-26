const PlaceholderPage = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center card-executive p-10 max-w-md">
        <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-4 w-16 h-1 bg-primary/30 mx-auto rounded-full" />
      </div>
    </div>
  );
};

export default PlaceholderPage;
