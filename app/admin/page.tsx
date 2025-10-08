import { redirect } from 'next/navigation';

const Page = () => {
  redirect('/admin/dashboard'); // immediately redirects

  return null; // optional, will never render
};

export default Page;
