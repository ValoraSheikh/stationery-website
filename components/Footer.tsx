import Image from "next/image";
import React from "react";

const Footer = () => {
  return (
    <>
      <footer aria-labelledby="footer-heading" className="bg-white">
        <h2 id="footer-heading" className="sr-only">
          Footer
        </h2>
        <div className="mx-auto max-w-full px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200">
            <div className="pt-16 pb-20">
              <div className="md:flex md:justify-center">
                <Image
                  height={500}
                  width={500}
                  src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                  alt=""
                  className="h-8 w-auto"
                />
              </div>
              <div className="mx-auto mt-16 max-w-5xl xl:grid xl:grid-cols-2 xl:gap-8">
                <div className="grid grid-cols-2 gap-8 xl:col-span-2">
                  <div className="space-y-12 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Products
                      </h3>
                      <ul role="list" className="mt-6 space-y-6">
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Bags
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Tees
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Objects
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Home Goods
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Accessories
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Customer Service
                      </h3>
                      <ul role="list" className="mt-6 space-y-6">
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Contact
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Shipping
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Returns
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Warranty
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Secure Payments
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            FAQ
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Find a store
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="space-y-12 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Company
                      </h3>
                      <ul role="list" className="mt-6 space-y-6">
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Who we are
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Sustainability
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Press
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Careers
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Terms &amp; Conditions
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Privacy
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Legal
                      </h3>
                      <ul role="list" className="mt-6 space-y-6">
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Terms of Service
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Return Policy
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Privacy Policy
                          </a>
                        </li>
                        <li className="text-sm">
                          <a
                            href="#"
                            className="text-gray-500 hover:text-gray-600"
                          >
                            Shipping Policy
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-6 xl:gap-x-8">
              <div className="flex items-center rounded-lg bg-gray-100 p-6 sm:p-10">
                <div className="mx-auto max-w-sm">
                  <h3 className="font-semibold text-gray-900">
                    Sign up for our newsletter
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    The latest news, articles, and resources, sent to your inbox
                    weekly.
                  </p>
                  <form className="mt-4 sm:mt-6 sm:flex">
                    <input
                      id="email-address"
                      type="text"
                      autoComplete="email"
                      aria-label="Email address"
                      className="block w-full rounded-md bg-white px-4 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:gray-indigo-600"
                    />
                    <div className="mt-3 sm:mt-0 sm:ml-4 sm:shrink-0">
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center rounded-md border border-transparent bg-gray-600 px-4 py-2 text-base font-medium text-white shadow-xs hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-hidden"
                      >
                        Sign up
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <div className="relative mt-6 flex items-center px-6 py-12 sm:px-10 sm:py-16 lg:mt-0">
                <div className="absolute inset-0 overflow-hidden rounded-lg">
                  <Image
                    fill
                    src="https://tailwindcss.com/plus-assets/img/ecommerce-images/footer-02-exclusive-sale.jpg"
                    alt=""
                    className="size-full object-cover saturate-0 filter"
                  />
                  <div className="absolute inset-0 bg-gray-600/90" />
                </div>
                <div className="relative mx-auto max-w-sm text-center">
                  <h3 className="text-2xl font-bold tracking-tight text-white">
                    Get early access
                  </h3>
                  <p className="mt-2 text-gray-200">
                    Did you sign up to the newsletter? If so, use the keyword we
                    sent you to get access.{" "}
                    <a
                      href="#"
                      className="font-bold whitespace-nowrap text-white hover:text-gray-200"
                    >
                      Go now<span aria-hidden="true"> →</span>
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="py-10 md:flex md:items-center md:justify-between">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-500">
                © 2021 All Rights Reserved
              </p>
            </div>
            <div className="mt-4 flex items-center justify-center md:mt-0">
              <div className="flex space-x-8">
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-600"
                >
                  Accessibility
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-600"
                >
                  Privacy
                </a>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-600"
                >
                  Terms
                </a>
              </div>
              <div className="ml-6 border-l border-gray-200 pl-6">
                <a
                  href="#"
                  className="flex items-center text-gray-500 hover:text-gray-600"
                >
                  <Image
                    height={500}
                    width={500}
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png?20240117202436"
                    alt=""
                    className="h-auto w-5 shrink-0"
                  />
                  <span className="ml-3 text-sm">Change</span>
                  <span className="sr-only">location and currency</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
