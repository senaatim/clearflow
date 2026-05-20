'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@clearflow.ng',
    sub: 'We respond within 24 hours',
  },
  {
    icon: MapPin,
    label: 'Office',
    value: 'Lagos, Nigeria',
    sub: 'Victoria Island',
  },
  {
    icon: Clock,
    label: 'Support Hours',
    value: 'Mon – Fri, 8am – 6pm WAT',
    sub: 'Closed on Nigerian public holidays',
  },
];

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder — wire up to your backend or email service
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">Contact Us</h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Have a question, feedback, or need help with your account? We would love to hear from
            you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {/* Contact info */}
          <div className="space-y-6">
            {CONTACT_INFO.map((item) => (
              <div
                key={item.label}
                className="bg-background-secondary border border-border rounded-xl p-6 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-primary/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-text-primary">{item.value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="bg-background-secondary border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-text-primary mb-2">Payment Enquiries</h3>
              <p className="text-sm text-text-secondary mb-2">
                For subscription payments and activations:
              </p>
              <p className="text-sm text-text-primary font-medium">Jbryanson Globals Limited</p>
              <p className="text-xs text-text-muted">Account No: 1224017438</p>
              <p className="text-xs text-text-muted">Zenith Bank</p>
              <p className="text-xs text-text-secondary mt-2">
                After payment, email us with your receipt to activate your plan.
              </p>
            </div>
          </div>

          {/* Contact form */}
          <div className="md:col-span-2 bg-background-secondary border border-border rounded-xl p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <CheckCircle className="w-16 h-16 text-success mb-4" />
                <h2 className="text-xl font-bold text-text-primary mb-2">Message Sent</h2>
                <p className="text-text-secondary max-w-sm">
                  Thanks for reaching out. We will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: '', email: '', subject: '', message: '' });
                  }}
                  className="mt-6 text-sm text-accent-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Full Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Ada Okonkwo"
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      Email Address <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ada@example.com"
                      className="w-full bg-background-primary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Subject <span className="text-error">*</span>
                  </label>
                  <select
                    name="subject"
                    required
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full bg-background-primary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
                  >
                    <option value="" disabled>
                      Select a topic
                    </option>
                    <option value="account">Account & Billing</option>
                    <option value="subscription">Subscription Activation</option>
                    <option value="technical">Technical Support</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="broker">Broker Execution Query</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Message <span className="text-error">*</span>
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us how we can help..."
                    className="w-full bg-background-primary border border-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    'Sending...'
                  ) : (
                    <>
                      Send Message
                      <Send className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
