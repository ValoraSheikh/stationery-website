import { redirect } from 'next/navigation';

const Page = () => {
  redirect('/ordersHistory'); // immediately redirects

  return null; // optional, will never render
};

export default Page;
