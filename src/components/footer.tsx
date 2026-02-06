const Footer = () => {
  return (
    <footer className="bg-background border-t pt-6 pb-32">
      <div className="container mx-auto px-4">
        <p className="text-center text-sm text-foreground/60">
          © {new Date().getFullYear()} TriPlanner. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
