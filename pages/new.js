import Navbar from '../components/navbar';
import PostForm from '../components/postform';

export default function NewPost() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Share Your Fries</h1>
        <PostForm />
      </main>
    </>
  );
} 