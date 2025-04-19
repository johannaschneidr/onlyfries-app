import Navbar from '../components/navbar';
import PostForm from '../components/postform';

export default function NewPost() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto p-4">
        <PostForm />
      </main>
    </>
  );
} 