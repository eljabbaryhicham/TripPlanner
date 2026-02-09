import Header from '@/components/header';
import Footer from '@/components/footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export default function FaqPage() {
  const faqs = [
    {
      question: 'How do I book a service?',
      answer:
        'To book a service, simply browse our selection of cars, hotels, or transport options. When you find one you like, click the "Book" button to open the details popup. Fill in your name and any required dates, then choose your preferred booking method: checkout online, email, or WhatsApp.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards through our secure online checkout powered by Stripe. For manual bookings via email or WhatsApp, payment arrangements will be communicated to you directly.',
    },
    {
      question: 'Can I cancel my reservation?',
      answer:
        'Cancellation policies vary depending on the service provider. For online checkouts, please review the cancellation terms before completing your payment. For manual bookings, please contact us directly to inquire about the cancellation policy.',
    },
    {
      question: 'How do I know my booking is confirmed?',
      answer:
        'If you complete a booking through our online checkout, your reservation is confirmed upon successful payment. If you book via email, you will receive a confirmation message from our team once we have processed your request.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="text-center mb-12">
            <HelpCircle className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 font-headline text-3xl font-bold md:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 max-w-2xl mx-auto text-lg text-foreground/80">
              Have questions? We have answers.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
}
