import { EmailSignup } from "@/components/EmailSignup";

const SiteFooter = () => {
  return (
    <footer className="border-t border-border mt-12">
      <div className="container mx-auto px-4 py-8">
        <EmailSignup />
      </div>
      <div className="border-t border-border py-4">
        <p className="text-center text-xs text-muted-foreground">
          This is a ProfC gig,{" "}
          <a href="https://profcnews.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            contact him to learn more
          </a>
        </p>
      </div>
    </footer>
  );
};

export default SiteFooter;
