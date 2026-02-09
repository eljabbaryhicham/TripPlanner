import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-background border-t pt-6 pb-32">
      <div className="container mx-auto px-4">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/about" className="text-sm text-foreground/80 hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/faq" className="text-sm text-foreground/80 hover:text-primary transition-colors">
            F.A.Q.
          </Link>
          <Link href="/contact" className="text-sm text-foreground/80 hover:text-primary transition-colors">
            Contact
          </Link>
        </div>
        <p className="text-center text-sm text-foreground/60">
          © {new Date().getFullYear()} TriPlanner. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
