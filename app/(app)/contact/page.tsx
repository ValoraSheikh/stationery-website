"use client";

import { useState } from "react";
import Image from "next/image";

type FormState = {
  name: string;
  email: string;
  phoneNo: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phoneNo: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormState | "submit", string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const onChange = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [k]: e.target.value }));
    setErrors((p) => ({ ...p, [k]: undefined, submit: undefined }));
    setSuccess(null);
  };

  const validate = (): boolean => {
    const nextErrors: typeof errors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = "Invalid email address";
    if (!form.phoneNo.trim()) nextErrors.phoneNo = "Phone number is required";
    else if (!/^[+\d\s\-()]{6,20}$/.test(form.phoneNo)) nextErrors.phoneNo = "Invalid phone number";
    if (!form.subject.trim()) nextErrors.subject = "Subject is required";
    if (!form.message.trim()) nextErrors.message = "Message is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phoneNo: form.phoneNo.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ submit: (data && data.message) || "Failed to send message" });
        setLoading(false);
        return;
      }

      setSuccess("Thanks — your message was sent. We'll get back to you soon.");
      setForm({ name: "", email: "", phoneNo: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact submit error:", err);
      setErrors({ submit: "Something went wrong. Please try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-24 mx-auto">
        <div className="mb-6 sm:mb-10 max-w-2xl text-center mx-auto">
          <h2 className="font-medium text-black text-2xl sm:text-4xl">Contacts</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-center gap-6 md:gap-8 lg:gap-12">
          <div className="aspect-w-16 aspect-h-6 lg:aspect-h-14 overflow-hidden bg-gray-100 rounded-2xl">
            <Image
              height={500}
              width={600}
              className="group-hover:scale-105 group-focus:scale-105 transition-transform duration-500 ease-in-out object-cover rounded-2xl"
              src="https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGNvbnRhY3R8ZW58MHx8MHx8fDA%3D"
              alt="Contacts Image"
            />
          </div>

          <div className="space-y-8 lg:space-y-16">
            <div>
              <h3 className="mb-5 font-semibold text-black">Our address</h3>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
                <div className="flex gap-4">
                  <svg className="shrink-0 size-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>

                  <div className="grow">
                    <p className="text-sm text-gray-600">United Kingdom</p>
                    <address className="mt-1 text-black not-italic">
                      300 Bath Street, Tay House
                      <br />
                      Glasgow G2 4JR
                    </address>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-5 font-semibold text-black">Our contacts</h3>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
                <div className="flex gap-4">
                  <svg className="shrink-0 size-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"></path>
                    <path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"></path>
                  </svg>

                  <div className="grow">
                    <p className="text-sm text-gray-600">Email us</p>
                    <p>
                      <a className="relative inline-block font-medium text-black" href="mailto:hello@example.so">hello@example.so</a>
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <svg className="shrink-0 size-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>

                  <div className="grow">
                    <p className="text-sm text-gray-600">Call us</p>
                    <p><a className="relative inline-block font-medium text-black" href="tel:+44222777000">+44 222 777-000</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl">Contact sales</h2>
            <p className="mt-2 text-lg/8 text-gray-600">Aute magna irure deserunt veniam aliqua magna enim voluptate.</p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-xl sm:mt-20" noValidate>
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm/6 font-semibold text-gray-900">Full name</label>
                <div className="mt-2.5">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={onChange("name")}
                    className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                    placeholder="John Doe"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-error" : undefined}
                  />
                  {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm/6 font-semibold text-gray-900">Email</label>
                <div className="mt-2.5">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onChange("email")}
                    className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                  {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="subject" className="block text-sm/6 font-semibold text-gray-900">Subject</label>
                <div className="mt-2.5">
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    value={form.subject}
                    onChange={onChange("subject")}
                    className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                    placeholder="What do you want to talk about?"
                    aria-invalid={!!errors.subject}
                    aria-describedby={errors.subject ? "subject-error" : undefined}
                  />
                  {errors.subject && <p id="subject-error" className="mt-1 text-sm text-red-600">{errors.subject}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="phoneNo" className="block text-sm/6 font-semibold text-gray-900">Phone number</label>
                <div className="mt-2.5">
                  <input
                    id="phoneNo"
                    name="phoneNo"
                    type="tel"
                    value={form.phoneNo}
                    onChange={onChange("phoneNo")}
                    placeholder="+91 12345 67891"
                    className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                    aria-invalid={!!errors.phoneNo}
                    aria-describedby={errors.phoneNo ? "phone-error" : undefined}
                  />
                  {errors.phoneNo && <p id="phone-error" className="mt-1 text-sm text-red-600">{errors.phoneNo}</p>}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="message" className="block text-sm/6 font-semibold text-gray-900">Message</label>
                <div className="mt-2.5">
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={onChange("message")}
                    className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:outline-indigo-600"
                    placeholder="Tell us more about what you need..."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                  />
                  {errors.message && <p id="message-error" className="mt-1 text-sm text-red-600">{errors.message}</p>}
                </div>
              </div>

            </div>

            <div className="mt-10">
              <button
                type="submit"
                disabled={loading}
                className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                {loading ? "Sending..." : "Let's talk"}
              </button>

              {errors.submit && <p className="mt-3 text-center text-red-600">{errors.submit}</p>}
              {success && <p className="mt-3 text-center text-green-600">{success}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
