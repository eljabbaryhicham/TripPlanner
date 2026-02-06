const Footer = () => {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-6">
        <p className="text-center text-sm text-foreground/60">
          © {new Date().getFullYear()} TriPlanner. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
